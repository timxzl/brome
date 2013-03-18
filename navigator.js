const MyID = chrome.i18n.getMessage("@@extension_id");
const login_domain = "https://login.live.com/"
const login_url = "https://login.live.com/logout.srf?id=264960&ru=https:%2F%2Flogin.live.com";
const account_url = "https://account.live.com";
const passport_url = "http://www.bing.com/Passport.aspx";
const rewards_url = "http://www.bing.com/rewards";

const login_tab_prop = {url: login_url, active:false};
const login_inject = {file: "login.js", runAt: "document_idle"};

const account_inject = {file: "account.js", runAt: "document_idle"};
const passport_inject = {file: "passport.js", runAt: "document_idle"};
const rewards_inject = {file: "rewards.js", runAt: "document_idle"};

const storage = chrome.storage.local;

const CharCodeA = 'a'.charCodeAt();
function randomWord() {
	var s = '';
	for (var len = 3+Math.floor(Math.random()*10); len>0; len--) {
		s += String.fromCharCode(CharCodeA+Math.floor(Math.random()*26));
	}
	return s;
}

function randomSec(low, high) {
	return low + Math.random()*(high-low);
}

function Navigator() {
	// tabid: int
	// email, pass: string
	// pendingRefresh: int
}
const NaviState = {
	tabid: true,
	email: true,
	pass: true,
	pendingRefresh: true,
	tasks: true
};

Navigator.prototype.save = function(callback) {
	const item = {};
	for (key in NaviState) {
		if (NaviState[key] && this.hasOwnProperty(key)) {
			item[key] = this[key];
		}
	}
	storage.set({navigator: item}, callback);
}

Navigator.prototype.load = function(callback) {
	storage.get('navigator', function(data) {
		const nv = data.navigator;
		for (key in NaviState) {
			if (NaviState[key] && nv.hasOwnProperty(key)) {
				this[key] = nv[key];
			}
		}
		callback();
	});
}

Navigator.prototype.stop = function() {
	if (this.hasOwnProperty('tabid') && this.tabid != null) {
		const tabid = this.tabid;
		this.tabid = null;
		this.save(null);
		chrome.tabs.remove(tabid);
	}
}

Navigator.prototype.init = function() {
	const me = this;
	this.load(function() {
		if (mvc) {
			mvc.setNavi(me);
		}
		chrome.tabs.onRemoved.addListener(function(tabid, info) {
			//alert('on remove ' + tabid);
			if (me.hasOwnProperty('tabid') && tabid == me.tabid) {
				me.tabid = null;
				me.save(null);
				mvc.completeRun(me.email, false);
			}
		});
		chrome.webNavigation.onCompleted.addListener(function(detail) {
			const url = detail.url;
			if (detail.tabId == me.tabid) {
				if (url.indexOf(login_domain)==0 && url.length-login_domain.length<10) {
					//alert('here ' + me.tabid + ' ' + detail.tabId);
					chrome.tabs.executeScript(me.tabid, login_inject);
				} else if (url.indexOf(account_url)==0) {
					chrome.tabs.executeScript(me.tabid, account_inject);
				} else if (url.indexOf(passport_url)==0) {
					//alert("redirect:" + tabid + ":" + url);
					chrome.tabs.executeScript(me.tabid, passport_inject);
				}
			}
		}
		, {url: [{hostSuffix: "live.com"}, {hostEquals: "www.bing.com"}]}
		);
		chrome.extension.onMessage.addListener(function(req, sender, respond) {
			const tab = sender.tab;
			//alert("req: " + req + " from: " + tab.id + " " + me.tabid + "#" + tab.url + "#" + login_url + "#" + me.email + " " + me.pass + " " + (tab.id==me.tabid) + " " + (tab.url == login_url));
			if (sender.id == MyID && tab.id == me.tabid) {
				if (req=="login") {
				       	if (tab.url.indexOf(login_domain)==0) {
						respond({e: me.email, p:me.pass});
					}
				} else if (req=="passport") {
					//alert("passport");
					chrome.tabs.reload(me.tabid, {bypassCache: false}, function() {
						//alert("rewards");
						chrome.tabs.executeScript(me.tabid, rewards_inject);
					});
				} else {
					//alert('pending ' + me.pendingRefresh);
					if (me.pendingRefresh>0) {
						me.pendingRefresh--;
						me.save(function() {
						       	chrome.tabs.reload(me.tabid, {bypassCache: false}, function() {
								chrome.tabs.executeScript(me.tabid, rewards_inject);
							});
						});
					} else {
						//alert('here ' + me.email + ' ' + req.balance);
						mvc.updateBalance(me.email, req.balance);
						me.tasks = req.tasks;
						me.doTasks();
					}
				}
			}
		});
		chrome.alarms.onAlarm.addListener(function(alarm) {
			//alert('alarm ' + alarm.name);
			if (me.tabid && alarm.name == "doTasks") {
				me.doTasks();
			}
		});
	});
}

Navigator.prototype.run = function(email, pass) {
	const me = this;
	this.email = email;
	this.pass = pass;
	this.pendingRefresh = 1;
	this.tasks = null;
	this.tabid = null;
	callback = function(tab) {
		me.tabid = tab.id;
		me.save(null);
	};
	me.save(function() {
		//alert('here');
		//if (me.tabid) {
			//chrome.tabs.update(me.tabid, login_tab_prop);
		//}
		chrome.tabs.create(login_tab_prop, callback);
	});
}

Navigator.prototype.doTasks = function() { if (this.tabid) {
	const tasks = this.tasks;
	const me = this;
	if (tasks && tasks.length > 0) {
		const task = tasks[tasks.length-1];
		const link = (task.link == "search") ? ("http://www.bing.com/search?q=" + randomWord()) : task.link;
		task.amnt--;
		if (task.amnt <= 0) {
			tasks.pop();
		}
		this.save(null);
		const callback = (tasks.length==0) ? function() {
			chrome.tabs.update(me.tabid, {url: rewards_url}, function(tab) {
				if (tab.id==me.tabid) {
					me.pendingRefresh = 2;
					me.save(function() {
						chrome.tabs.executeScript(me.tabid, rewards_inject);
					});
				}
			});
		} : function() {
			const delay = randomSec(parseFloat(mvc.gap_low), parseFloat(mvc.gap_high))/60.0;
			chrome.alarms.create("doTasks", {delayInMinutes:delay});
			//alert("delay " + delay + " " + link);
		};
		chrome.tabs.update(me.tabid, {url:link}, callback);
	} else {
		// no tasks to do, close the tab
		const tabid = me.tabid;
		me.tabid = null;
		me.save(function() {
			chrome.tabs.remove(tabid);
			mvc.completeRun(me.email, true);
		});
	}
}}

// Singleton
const navi = new Navigator();
navi.init();
