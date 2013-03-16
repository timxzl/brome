const login_domain = "https://login.live.com/"
const login_url = "https://login.live.com/logout.srf?id=264960&ru=https:%2F%2Flogin.live.com";
const account_url = "https://account.live.com";
const rewards_url = "http://www.bing.com/rewards";

const login_tab_prop = {"url": login_url};
const login_inject = {"file": "login.js", "runAt": "document_idle"};

const account_inject = {"file": "account.js", "runAt": "document_idle"};
const rewards_inject = {"file": "rewards.js", "runAt": "document_idle"};

const storage = chrome.storage.local;

function Navigator() {
	// tabid: int
	// email, pass: string
}

Navigator.prototype.getEmail = function() {
	return email;
}

Navigator.prototype.getPass = function() {
	return pass;
}

Navigator.prototype.save = function() {
	storage.set({tabid: this.tabid});
}


Navigator.prototype.load = function() {
	storage.get('tabid', function(data) { if(data) me.tabid = data; });
}

Navigator.prototype.init = function() {
	if (mvc) {
		mvc.setNavi(this);
	}
	const me = this;
	chrome.webNavigation.onCompleted.addListener(function(detail) {
		const tabid = detail.tabId;
		const url = detail.url;
		//alert("redirect:" + tabid + ":" + url);
		if (tabid == me.tabid) {
			if (url.indexOf(login_domain)==0 && url.length-login_domain.length<10) {
				chrome.tabs.executeScript(tabid, login_inject);
			} else if (url.indexOf(account_url)>=0) {
				chrome.tabs.executeScript(tabid, account_inject);
			} else if (url.indexOf(rewards_url)>=0) {
				chrome.tabs.executeScript(tabid, rewards_inject);
			}
		}
	}, {url: [{hostSuffix: "live.com"}, {hostEquals: "www.bing.com"}]});
	chrome.extension.onMessage.addListener(function(req, sender, respond) {
		const tab = sender.tab;
		//alert("req: " + req + " from: " + tab.id + " " + me.tabid + "#" + tab.url + "#" + login_url + "#" + me.email + " " + me.pass + " " + (tab.id==me.tabid) + " " + (tab.url == login_url));
		if (tab.id == me.tabid) {
			if (req=="login" && tab.url.indexOf(login_domain)==0) {
				respond({e: me.email, p:me.pass});
			} else {
				//console.log('call updateBalance(' + me.email + ',' + req.balance);
				mvc.updateBalance(me.email, req.balance);
			}
		}
	});
}

Navigator.prototype.run = function(email, pass) {
	const me = this;
	this.email = email;
	this.pass = pass;
	chrome.tabs.create(login_tab_prop, function(tab) {
		var tabid = tab.id;
		me.tabid = tabid;
	});
}


// Singleton
const navi = new Navigator();
navi.init();

