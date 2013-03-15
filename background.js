const storage = chrome.storage.local;

function clearTab(tab) {
	const m = tab.rows.length;
	for (var i=m-1; i>=0; i--) {
		tab.deleteRow(i);
	}
}

function setReadOnly(v) {
	return function () {
		this.readOnly = v;
	}
}


function MVC() {
// view: document
// accounts: [{email, pass}]
	this.cur = 0;
	this.runtab = null;
	this.iters = 33;
	this.wait_low = 3;
	this.wait_high = 7;
	this.gap_low = 1;
	this.gap_high = 5;
	this.accounts = [];
}

MVC.prototype.saveData = function(key) {
	const item = {};
	item[key] = this[key];
	storage.set(item);
}

MVC.prototype.onChange = function(elm) {
	elm.onblur = function() {
		this.applyChange(elm);
	}
}

MVC.prototype.applyChange = function(elm) {
	// change the model
	//delete elm.onblur;
	const accounts = this.accounts;
	const index = elm.index;
	const field = elm.field;
	var needRefresh = false;

	if (index < accounts.length) {
		const value = elm.value;
		if (value.length == 0 && field=='email') {
			accounts.splice(index,1);
			needRefresh = true;
		} else{
			accounts[index][field] = value;
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

MVC.prototype.refreshTab = function() {
	const me = this;
	const view = this.view;
	const tab = view.getElementById('accounts');
	const accounts = this.accounts;
	clearTab(tab);
	const n = accounts.length;
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
		if (i<n) {
			emailbox.onblur = setReadOnly(true);
			passbox.onblur = setReadOnly(true);
			var btn = view.createElement('input');
			btn.type = 'button';
			btn.id = 'button' + i;
			btn.index = i;
			btn.value = (i==this.cur) ? '*' : ' ';
			colBtn.appendChild(btn);
		}

		colEmail.appendChild(emailbox);
		colPass.appendChild(passbox);

		var checkbox = view.createElement('input');
		checkbox.checked = true;
		checkbox.type = 'checkbox';
		checkbox.id = 'check' + i;
		colCheck.appendChild(checkbox);

		row.appendChild(colBtn);
		row.appendChild(colCheck);
		row.appendChild(colEmail);
		row.appendChild(colPass);
		tab.appendChild(row);
	}
}

MVC.prototype.refreshControl = function() {
	const me = this;
	const view = this.view;
	const controls = view.getElementsByClassName('control');
	for (var i=0; i<controls.length; i++) {
		var c = controls[i];
		c.value = this[c.id];
		c.onchange = function() {
			const key = this.id;
			me[key] = this.value;
			me.saveData(key);
		}
	}
	const runbtn = view.getElementById('run');
	runbtn.onclick = function() {
		me.runtab = true;
		me.refreshTab();
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

MVC.prototype.loadData = function() {
	const me = this;
	storage.get(null, function(data) {
		for (key in data) {
			me[key] = data[key];
		}
		if (!me.accounts) {
			me.accounts = [];
		}
		if (me.view) {
			me.refreshView();
		}
	});
}

// Singleton
const mvc = new MVC();
mvc.loadData();
