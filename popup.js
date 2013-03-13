var storage = chrome.storage.local;
var tab;

function clearTab(tab) {
	const m = tab.rows.length;
	for (var i=m-1; i>=0; i--) {
		tab.deleteRow(i);
	}
}

function MVC() {}

MVC.prototype.initData = function(accounts) {
	this.accounts = accounts;
	this.refresh();
}

MVC.prototype.saveData = function() {
	storage.set({accounts: this.accounts});
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
		e = document.getElementById('email' + index);
		item = {email: e.value, pass: elm.value};
		accounts.push(item);
		needRefresh = true;
	}

	this.saveData();

	if (needRefresh) {
		this.refresh();
	}
}

MVC.prototype.refresh = function() {
	const me = this;
	const accounts = this.accounts;
	clearTab(tab);
	const n = accounts.length;
	for (var i=0; i <= n; i++) {
		var account = {};
		if (i<n) {
			account = accounts[i];
		}
		var email = account.hasOwnProperty('email') ? account.email : '';
		var pass = account.hasOwnProperty('pass') ? account.pass : '';

		var row = document.createElement('tr');
		var colCheck = document.createElement('td');
		var colEmail = document.createElement('td');
		var colPass = document.createElement('td');

		var emailbox = document.createElement('input');
		emailbox.type = 'text';
		emailbox.readOnly = (i<n);
		emailbox.id = 'email' + i;
		emailbox.index = i;
		emailbox.field = 'email';
		emailbox.value = email;
		emailbox.onchange = function() {
			me.applyChange(this);
		}
		if (i<n) {
			emailbox.onblur = function() {
				this.readOnly = true;
			}
		}
		emailbox.ondblclick = function() {
			this.readOnly = false;
		}
		colEmail.appendChild(emailbox);

		var passbox = document.createElement('input');
		passbox.readOnly = (i<n);
		passbox.type = 'password';
		passbox.id = 'pass' + i;
		passbox.index = i;
		passbox.field = 'pass';
		passbox.value = pass;
		passbox.onchange = function() {
			me.applyChange(this);
		}
		passbox.ondblclick = function() {
			this.readOnly = false;
		}
		if (i<n) {
			passbox.onblur = function() {
				this.readOnly = true;
			}
		}
		colPass.appendChild(passbox);

		if (i < n) {
			var checkbox = document.createElement('input');
			checkbox.checked = true;
			checkbox.type = 'checkbox';
			checkbox.id = 'check' + i;
			colCheck.appendChild(checkbox);
		}

		row.appendChild(colCheck);
		row.appendChild(colEmail);
		row.appendChild(colPass);
		tab.appendChild(row);
	}
}

const mvc = new MVC();

function getAccounts() {
	storage.get(null, function(data) {
		var accounts = data.hasOwnProperty('accounts') ? data.accounts : [];
		mvc.initData(accounts);
	});
}

window.onload = function() {
	tab = document.getElementById('accounts');
	getAccounts();
}
