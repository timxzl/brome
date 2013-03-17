const login_domain = "https://login.live.com/"
const login_url = "https://login.live.com/logout.srf?id=264960&ru=https:%2F%2Flogin.live.com";
const account_url = "https://account.live.com";
const passport_url = "http://www.bing.com/Passport.aspx";
const rewards_url = "http://www.bing.com/rewards";

const login_tab_prop = {url: login_url};
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

Navigator.prototype.init = function() {
	const me = this;
	this.load(function() {
		if (mvc) {
			mvc.setNavi(me);
		}
		chrome.tabs.onRemoved.addListener(function(tabid, info) {
			if (tabid == me.tabid) {
				me.tabid = null;
				me.save();
			}
		});
		chrome.webNavigation.onCompleted.addListener(function(detail) {
			const tabid = detail.tabId;
			const url = detail.url;
			if (tabid == me.tabid) {
				if (url.indexOf(login_domain)==0 && url.length-login_domain.length<10) {
					chrome.tabs.executeScript(tabid, login_inject);
				} else if (url.indexOf(account_url)==0) {
					chrome.tabs.executeScript(tabid, account_inject);
				} else if (url.indexOf(passport_url)==0) {
					//alert("redirect:" + tabid + ":" + url);
					chrome.tabs.executeScript(tabid, passport_inject);
				}
			}
		}
		, {url: [{hostSuffix: "live.com"}, {hostEquals: "www.bing.com"}]}
		);
		chrome.extension.onMessage.addListener(function(req, sender, respond) {
			const tab = sender.tab;
			const tabid = tab.id;
			//alert("req: " + req + " from: " + tab.id + " " + me.tabid + "#" + tab.url + "#" + login_url + "#" + me.email + " " + me.pass + " " + (tab.id==me.tabid) + " " + (tab.url == login_url));
			if (tabid == me.tabid) {
				if (req=="login") {
				       	if (tab.url.indexOf(login_domain)==0) {
						respond({e: me.email, p:me.pass});
					}
				} else if (req=="passport") {
					//alert("passport");
					chrome.tabs.reload(tabid, {bypassCache: false}, function() {
						//alert("rewards");
						chrome.tabs.executeScript(tabid, rewards_inject);
					});
				} else {
					//alert('pending ' + me.pendingRefresh);
					if (me.pendingRefresh>0) {
						me.pendingRefresh--;
						me.save(function() {
						       	chrome.tabs.reload(tabid, {bypassCache: false}, function() {
								chrome.tabs.executeScript(tabid, rewards_inject);
							});
						});
					} else {
						alert('here ' + me.email + ' ' + req.balance);
						mvc.updateBalance(me.email, req.balance);
						me.tasks = req.tasks;
						me.doTasks();
					}
				}
			}
		});
		chrome.alarms.onAlarm.addListener(function(alarm) {
			//alert('alarm ' + alarm.name);
			if (alarm.name == "doTasks") {
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
		var tabid = tab.id;
		me.tabid = tabid;
		me.save();
	};
	me.save(function() {
		//alert('here');
		//if (me.tabid) {
			//chrome.tabs.update(me.tabid, login_tab_prop);
		//}
		chrome.tabs.create(login_tab_prop, callback);
	});
}

Navigator.prototype.doTasks = function() {
	const tasks = this.tasks;
	//alert("doTasks: " + tasks);
	const tabid = this.tabid;
	if (tasks.length > 0) {
		const task = tasks[tasks.length-1];
		const link = (task.link == "search") ? ("http://www.bing.com/search?q=" + randomWord()) : task.link;
		task.amnt--;
		if (task.amnt <= 0) {
			tasks.pop();
		}
		this.save();
		const callback = (tasks.length==0) ? function() {
			chrome.tabs.update(tabid, {url: rewards_url}, function(tab) {
				if (tab.id==tabid) {
					chrome.tabs.executeScript(tabid, rewards_inject);
				}
			});
		} : function() {
			const delay = randomSec(parseFloat(mvc.gap_low), parseFloat(mvc.gap_high))/60.0;
			chrome.alarms.create("doTasks", {delayInMinutes:delay});
			//alert("delay " + delay + " " + link);
		};
		chrome.tabs.update(tabid, {url:link}, callback);
	}
}

// Singleton
const navi = new Navigator();
navi.init();
