const storage = chrome.storage.local;

function clearTab(tab) {
	const m = tab.rows.length;
	for (var i=m-1; i>=0; i--) {
		tab.deleteRow(i);
	}
}


function MVC() {
// view: document
// accounts: [{email, pass}]
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
		e = this.view.getElementById('email' + index);
		item = {email: e.value, pass: elm.value};
		accounts.push(item);
		needRefresh = true;
	}

	this.saveData();

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
		if (i<n) {
			emailbox.onblur = function() {
				this.readOnly = true;
			}
		}
		emailbox.ondblclick = function() {
			this.readOnly = false;
		}
		colEmail.appendChild(emailbox);

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
			var checkbox = view.createElement('input');
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

MVC.prototype.refreshView = function() {
	this.refreshTab();
}

MVC.prototype.setView = function(view) {
	this.view = view;
	this.refreshView();
}

MVC.prototype.loadData = function() {
	const me = this;
	storage.get(null, function(data) {
		me.accounts = data.accounts ? data.accounts : [];
		if (me.view) {
			me.refreshView();
		}
	});
}

// Singleton
const mvc = new MVC();
mvc.loadData();
