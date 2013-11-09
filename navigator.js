const MyID = chrome.i18n.getMessage("@@extension_id");
const login_domain = "https://login.live.com/"
const login_url = "https://login.live.com/";
const account_url = "https://account.live.com";
const passport_url = "http://www.bing.com/Passport.aspx";
const rewards_url = "http://www.bing.com/rewards";

const login_tab_prop = {url: login_url, active:false};
const login_inject = {file: "login.js", runAt: "document_idle"};

const account_inject = {file: "account.js", runAt: "document_idle"};
const passport_inject = {file: "passport.js", runAt: "document_idle"};
const rewards_inject = {file: "rewards.js", runAt: "document_idle"};
const task_inject = {file: "task.js", runAt: "document_idle"};

const MaxKeywords = 1000;

const storage = chrome.storage.local;

function unique(a) {
	// a is already sorted
	var j = 0;
	for (var i=1; i<a.length; i++) {
		if (a[i].indexOf(a[j])<0) {
			j++;
			if (i != j) {
				a[j] = a[i];
			}
		}
	}
	a.splice(j, a.length-j);
}

const CharCodeA = 'a'.charCodeAt();
function randomWord(words) {
	var i = Math.floor(Math.random()*words.length);
	if (i >= words.length) {
		i = words.length-1;
	}
	return words[i];
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
	tasks: true,
	keywords: true
};

Navigator.prototype.updateKeywords = function(words) {
	const keywords = this.keywords;
	keywords.push.apply(keywords, words);
	keywords.sort();
	unique(keywords);
	while (keywords.length > MaxKeywords) {
		var i = Math.floor(Math.random()*(keywords.length-1));
		keywords.splice(i,1);
	}
	this.save();
}

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
	const me = this;
	storage.get('navigator', function(data) {
		const nv = data.navigator;
		//alert(nv);
		if (nv) {
			for (key in NaviState) {
				if (NaviState[key] && nv.hasOwnProperty(key)) {
					me[key] = nv[key];
				}
			}
		}
		if (!me.keywords || me.keywords.length<3) {
			me.keywords = ['news', 'weather', 'sports', 'science', 'technology', 'programming', 'language', 'openssl', 'android', 'iphone', 'google'];
		}
		if (callback) {
			callback();
		}
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
					const delay = randomSec(parseFloat(mvc.wait_low), parseFloat(mvc.wait_high))/60.0;
					chrome.alarms.create("doLogin", {delayInMinutes:delay});
					//alert('delay ' + delay);
					//chrome.tabs.executeScript(me.tabid, login_inject);
				} else if (url.indexOf(account_url)==0) {
					//alert("account_url");
					chrome.tabs.executeScript(me.tabid, account_inject);
				} else if (url.indexOf(passport_url)==0) {
					//alert("redirect:" + tabid + ":" + url);
					chrome.tabs.executeScript(me.tabid, passport_inject);
				} else if (url.indexOf(rewards_url) >= 0) {
				    //alert("rewards: " + url);
				    chrome.tabs.executeScript(me.tabid, rewards_inject);
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
				} else if (req.type == 'task') {
					if (req.words && req.words.length>0) {
						me.updateKeywords(req.words);
					}
					const delay = randomSec(parseFloat(mvc.gap_low), parseFloat(mvc.gap_high))*1000;
					respond(delay);
				} else if (req.type == 'taskDone') {
					//alert('taskDone');
					me.taskDone();
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
			if (me.tabid) {
				if (alarm.name == "doLogin") {
					chrome.tabs.executeScript(me.tabid, login_inject);
				}
			}
		});
	});
}

Navigator.prototype.run = function(email, pass) {
	const me = this;
	this.email = email;
	this.pass = pass;
	this.pendingRefresh = 2;
	this.tasks = null;
	this.tabid = null;
	login_tab_prop.windowId = mvc.windowId;
	callback = function(tab) {
		me.tabid = tab.id;
		me.save(null);
	};
	me.save(function() {
		//alert('here');
		//if (me.tabid) {
			//chrome.tabs.update(me.tabid, login_tab_prop);
		//}
		//alert(mvc.windowId);
		chrome.tabs.create(login_tab_prop, callback);
	});
}

Navigator.prototype.taskDone = function() { if (this.tabid) {
	const tasks = this.tasks;
	const task = tasks[tasks.length-1];
	const me = this;
	task.amnt--;
	if (task.amnt <= 0) {
		tasks.pop();
	}
	this.save();
	if (tasks.length == 0) {
		// no more tasks, should check balance again
		chrome.tabs.update(me.tabid, {url: rewards_url}, function(tab) { if (tab.id==me.tabid) {
			me.pendingRefresh = 3;
			me.save();
			chrome.tabs.executeScript(me.tabid, rewards_inject);
		}});
	} else {
		// try to do another task
		this.doTasks();
	}
}}

Navigator.prototype.doTasks = function() { if (this.tabid) {
	const tasks = this.tasks;
	const me = this;
	if (tasks && tasks.length > 0) {
		const task = tasks[tasks.length-1];
		const link = (task.link == "search") ? ("http://www.bing.com/search?q=" + randomWord(this.keywords)) : task.link;
		chrome.tabs.update(me.tabid, {url:link}, function(tab) {
			chrome.tabs.executeScript(me.tabid, task_inject);
		});
	} else {
		// no tasks to do, close the tab
		const tabid = me.tabid;
		me.tabid = null;
		me.save(function() {
			//chrome.tabs.remove(tabid);
			mvc.completeRun(me.email, true);
		});
	}
}}

// Singleton
const navi = new Navigator();
navi.init();
