var storage = chrome.storage.local;

function findEmail(accounts, email) {
	for (var i=0; i<accounts.length; i++) {
		if (accounts[i].email == email) {
			return i;
		}
	}
	return -1;
}

function findNextChecked(accounts, i) {
	var end = accounts.length-1;
	var j = (i>=0 && i<=end) ? i : 0;
	do {
		if (accounts[j].checked) {
			return j;
		}
		if (j == end) {
			j = 0;
		} else {
			j++;
		}
	} while(j != i);
	return -1;
}

function clearTab(tab) {
	var m = tab.rows.length;
	for (var i=m-1; i>=0; i--) {
		tab.deleteRow(i);
	}
}

function setReadOnly(v) {
	return function () {
		this.readOnly = v;
	}
}

function balanceId(index,p) {
	return "history" + index + ":" + p;
}

var history_len = 5;
function MVC() {
// view: document
// navi: Navigator
// accounts: [{email, pass, [balance], checked}]
	this.cur = 0;
	this.running = false;
	this.windowId = null;
	this.wait_low = 3;
	this.wait_high = 7;
	this.gap_low = 1;
	this.gap_high = 5;
	this.accounts = [];
}
var MVCState = {
	cur: 1,
	running: 1,
	windowId: 1,
       	iters: 2,
	wait_low: 2,
	wait_high: 2,
	gap_low: 2,
	gap_high: 2,
	accounts: 99
};

MVC.prototype.setNavi = function(nv) {
	this.navi = nv;
}

MVC.prototype.run = function(i) {
	var account = this.accounts[i];
	this.cur = i;
	if (!this.running) { this.running = true; }
	this.saveData('cur');
	this.navi.run(account.email, account.pass);
	this.refreshTab();
}

MVC.prototype.runall = function() {
	this.navi.stop();
	var accounts = this.accounts;
	this.cur = findNextChecked(accounts, this.cur);
	if (this.cur >= 0) {
		this.running = 'all';
		var me = this;
		chrome.windows.getLastFocused(null, function(win) {
			me.windowId = win.id;
			me.save();
			me.run(me.cur);
		});
	}
}

MVC.prototype.completeRun = function(email, finished) {
	var accounts = this.accounts;
	var cur = this.cur;
	if (accounts[cur].email == email) {
		//this.view.getElementById('run' + this.cur).value = '*';
		if (finished) {
			accounts[cur].checked = false;
			if (this.running == 'all') {
				this.cur = findNextChecked(accounts, cur);
				if (this.cur >= 0) {
					var delay = randomSec(parseFloat(this.wait_low), parseFloat(this.wait_high))/60.0;
					chrome.alarms.create("doAll", {delayInMinutes:delay});
				}
				else {
					this.running = false;
					this.windowId = null;
				}
			} else{
				this.running = false;
			}
		} else {
			this.running = false;
		}
		this.save();
		this.refreshTab();
	}
}

MVC.prototype.saveData = function(key) {
	var item = {};
	item[key] = this[key];
	storage.set(item);
}

MVC.prototype.save = function() {
	var item = {};
	for (key in MVCState) {
		if (MVCState[key] && this.hasOwnProperty(key)) {
			item[key] = this[key];
		}
	}
	storage.set(item);
}

MVC.prototype.clear = function(level) {
	var keys = [];
	for (key in MVCState) {
		if (MVCState[key] == level) {
			keys.push(key);
		}
	}
	storage.remove(keys);
}

MVC.prototype.load = function() {
	var me = this;
	storage.get(null, function(data) {
		for (key in MVCState) {
			if (MVCState[key] && data.hasOwnProperty(key)) {
				me[key] = data[key];
			}
		}
		if (!me.accounts) {
			me.accounts = [];
		}
		if (me.view) {
			me.refreshView();
		}
	});
}



MVC.prototype.updateHistory = function(index) {
	var view = this.view;
	if (view) {
		var history = this.accounts[index].history;
		for (var i=0; i<history.length; i++) {
			var td = view.getElementById(balanceId(index, i));
			if (td) {
				td.innerHTML = history[i];
			}
		}
	}
}

MVC.prototype.clearHistory = function(index) {
	this.accounts[index].history = [];
	this.saveData("accounts");
	var view = this.view;
	for (var i=0; i<history_len; i++) {
		var td = view.getElementById(balanceId(index, i));
		if (td) {
			td.innerHTML = "";
		}
	}
}

MVC.prototype.updateBalance = function(email, balance) {
	var accounts = this.accounts;
	var index = findEmail(accounts, email);
	if (index >= 0) {
		var history = accounts[index].history;
		if (!history) {
			history = [];
			accounts[index].history = history;
		}
		if (history.length==0 || balance != history[0]) {
			if (history.length >= history_len) {
				history.splice(history_len, history.length-history_len);
				var to_del = history_len-1;
				for (var j=to_del; j>0; j--) {
					if (history[j]<history[j-1] && history[j-1]-history[j]<=5) {
						to_del = j;
						break;
					}
				}
				history.splice(to_del, 1);
			}
			// insert into 0
			history.splice(0,0,balance);
			this.updateHistory(index);
			this.saveData("accounts");
		}
	}
}

MVC.prototype.onChange = function(elm) {
	elm.onblur = function() {
		this.applyChange(elm);
	}
}

MVC.prototype.applyChange = function(elm) {
	// change the model
	//delete elm.onblur;
	var accounts = this.accounts;
	var index = elm.index;
	var field = elm.field;
	var needRefresh = false;

	if (index < accounts.length) {
		if (elm.field == 'checked') {
			accounts[index].checked = elm.checked;
		} else {
			var value = elm.value;
			if (value.length == 0 && field=='email') {
				accounts.splice(index,1);
				needRefresh = true;
			} else{
				accounts[index][field] = value;
			}
		}
	} else {
		if (field != 'pass') {
			return;
		}
		e = elm.parentElement.previousSibling.firstChild;
		item = {email: e.value, pass: elm.value};
		accounts.push(item);
		needRefresh = true;
	}

	this.saveData('accounts');

	if (needRefresh) {
		// TODO: refresh tab or the whole view?
		this.refreshTab();
	}
}

MVC.prototype.refreshTab = function() { if (this.view) {
	var me = this;
	var view = this.view;
	var tab = view.getElementById('accounts');
	var  accounts = this.accounts;
	clearTab(tab);
	var n = accounts.length;
	var allcheckbox = [];
	for (var i=0; i <= n; i++) {
		var account = {};
		if (i<n) {
			account = accounts[i];
		}
		var email = account.email ? account.email : '';
		var pass = account.pass ? account.pass : '';

		var row = view.createElement('tr');
		var colBtn = view.createElement('td');
		var colCheck = view.createElement('td');
		var colEmail = view.createElement('td');
		var colPass = view.createElement('td');

		var emailbox = view.createElement('input');
		emailbox.type = 'text';
		emailbox.readOnly = (i<n);
		emailbox.id = 'email' + i;
		emailbox.index = i;
		emailbox.field = 'email';
		emailbox.value = email;
		emailbox.onchange = function() {
			me.applyChange(this);
		}
		emailbox.ondblclick = setReadOnly(false);

		var passbox = view.createElement('input');
		passbox.readOnly = (i<n);
		passbox.type = 'password';
		passbox.id = 'pass' + i;
		passbox.index = i;
		passbox.field = 'pass';
		passbox.value = pass;
		passbox.onchange = function() {
			me.applyChange(this);
		}
		passbox.ondblclick = setReadOnly(false);
		var btn = view.createElement('input');
		btn.type = 'button';
		if (i<n) {
			emailbox.onblur = setReadOnly(true);
			passbox.onblur = setReadOnly(true);
			btn.id = 'run' + i;
			btn.index = i;
			btn.value = (i==this.cur) ? (this.running ? '$' : '*') : (i+1);
			btn.onclick = function() {
				me.windowId = null;
				me.saveData("windowId");
				me.run(this.index);
			}
		} else {
			btn.id = 'runall';
			btn.value = "\u2200"; //forall symbol
			btn.onclick = function() {
				me.runall();
			}
		}
		colBtn.appendChild(btn);


		colEmail.appendChild(emailbox);
		colPass.appendChild(passbox);

		var checkbox = view.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.id = 'check' + i;
		checkbox.index = i;
		checkbox.field = 'checked';
		if (i==n) {
			checkbox.onchange = function() {
				var v = this.checked;
				for (var j=0; j<n; j++) {
					allcheckbox[j].checked = v;
					accounts[j].checked = v;
				}
				me.saveData('accounts');
			}
		} else {
			checkbox.checked = account.checked;
			checkbox.onchange = function() {
				me.applyChange(this);
			}
			allcheckbox.push(checkbox);
		}
		colCheck.appendChild(checkbox);

		row.appendChild(colBtn);
		row.appendChild(colCheck);
		row.appendChild(colEmail);
		row.appendChild(colPass);
		if (i<n) {
			var history = this.accounts[i].history;
			for (var j=0; j<history_len; j++) {
				var colHistory = view.createElement('td');
				colHistory.id = balanceId(i,j);
				colHistory.index = i;
				colHistory.field = "history";
				colHistory.pos = j;
				//colHistory.innerHTML = (history && history[j]) ? history[j] : "&nbsp &nbsp &nbsp &nbsp";
				if (history && history[j]) {
					colHistory.innerHTML = history[j];
				}
				row.appendChild(colHistory);
			}
			var colClear = view.createElement('td');
			var btnClear = view.createElement('input');
			btnClear.type = 'button';
			btnClear.id = 'btnClear' + i;
			btnClear.index = i;
			btnClear.value = 'x';
			btnClear.onclick = function() {
				me.clearHistory(this.index);
			}
			colClear.appendChild(btnClear);
			row.appendChild(colClear);
		}

		tab.appendChild(row);
	}
}}

MVC.prototype.refreshControl = function() {
	var me = this;
	var view = this.view;
	var controls = view.getElementsByClassName('control');
	for (var i=0; i<controls.length; i++) {
		var c = controls[i];
		c.value = this[c.id];
		c.onchange = function() {
			var key = this.id;
			me[key] = this.value;
			me.saveData(key);
		}
	}
	var clears = view.getElementsByClassName('clear');
	for (var i=0; i<clears.length; i++) {
		var c = clears[i];
		c.onclick = function() {
			var level = parseInt(this.id);
			me.clear(level);
		}
	}
}

MVC.prototype.refreshView = function() {
	this.refreshTab();
	this.refreshControl();
}

MVC.prototype.setView = function(view) {
	if (view != this.view) {
		this.view = view;
		this.refreshView();
	}
}

MVC.prototype.init = function() {
	this.load();
	var me = this;
	chrome.alarms.onAlarm.addListener(function(alarm) {
		if (alarm.name == 'doAll' && me.running == 'all') {
			me.run(me.cur);
		}
	});
}

// Singleton
var mvc = new MVC();
mvc.init();
