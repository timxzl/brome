var MyID = chrome.i18n.getMessage("@@extension_id");
var login_domain = "https://login.live.com/"
var login_url = "https://login.live.com/";
var account_url = "https://account.live.com";
var passport_url = "https://www.bing.com/Passport.aspx";
var rewards_url = "www.bing.com/rewards";
var rewards_redirect_url = "http://www.bing.com/rewards";

var login_tab_prop = {url: login_url, active:false};
var login_inject = {file: "login.js", runAt: "document_idle"};

var account_inject = {file: "account.js", runAt: "document_idle"};
var passport_inject = {file: "passport.js", runAt: "document_idle"};
var rewards_inject = {"file": "rewardsinj.js", "runAt": "document_idle"};
var task_inject = {file: "task.js", runAt: "document_idle"};

var MaxKeywords = 1000;

var storage = chrome.storage.local;

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

var CharCodeA = 'a'.charCodeAt();
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
var NaviState = {
	tabid: true,
	email: true,
	pass: true,
	pendingRefresh: true,
	tasks: true,
	keywords: true
};

Navigator.prototype.updateKeywords = function(words) {
	var keywords = this.keywords;
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
	var item = {};
	for (key in NaviState) {
		if (NaviState[key] && this.hasOwnProperty(key)) {
			item[key] = this[key];
		}
	}
	storage.set({navigator: item}, callback);
}

Navigator.prototype.load = function(callback) {
	var me = this;
	storage.get('navigator', function(data) {
		var nv = data.navigator;
		//alert(nv);
		if (nv) {
			for (key in NaviState) {
				if (NaviState[key] && nv.hasOwnProperty(key)) {
					me[key] = nv[key];
				}
			}
		}
		if (!me.keywords || me.keywords.length<3) {
			me.keywords = ['news', 'weather', 'sports', 'science', 'technology', 'programming', 'language', 'openssl', 'android', 'iphone', 'google', 'cycle', 'longest', 'simple', 'floid', 'umvc', 'payment'];
		}
		if (callback) {
			callback();
		}
	});
}

Navigator.prototype.stop = function() {
	if (this.hasOwnProperty('tabid') && this.tabid != null) {
		var tabid = this.tabid;
		this.tabid = null;
		this.save(null);
		chrome.tabs.remove(tabid);
	}
}

Navigator.prototype.init = function() {
	var me = this;
	//alert("init");
	this.load(function() {
		//alert("loaded");
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
			var url = detail.url;
			if (detail.tabId == me.tabid) {
				if (url.indexOf(login_domain)==0 && url.length-login_domain.length<10) {
					//alert('here ' + me.tabid + ' ' + detail.tabId);
					var delay = randomSec(parseFloat(mvc.wait_low), parseFloat(mvc.wait_high))/60.0;
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
				    //alert("rewards: " + url + " tabid: " + me.tabid);
				    chrome.tabs.executeScript(me.tabid, rewards_inject);
				}
			}
		}
		, {url: [{hostSuffix: "live.com"}, {hostSuffix: "bing.com"}]}
		);
		chrome.extension.onMessage.addListener(function(req, sender, respond) {
			var tab = sender.tab;
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
					//alert(JSON.stringify(req) + " sender: " + JSON.stringify(sender) + " respond: " + respond);
					if (req.words && req.words.length>0) {
						me.updateKeywords(req.words);
					}
					var delay = randomSec(parseFloat(mvc.gap_low), parseFloat(mvc.gap_high))*1000;
					//alert("delay: " + delay);
					respond(delay);
				} else if (req.type == 'taskDone') {
					//alert('taskDone');
					me.taskDone();
				} else {
					//alert('pending ' + me.pendingRefresh + " req: " + JSON.stringify(req));
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
	var me = this;
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
	var tasks = this.tasks;
	console.log("in taskDone: tasks.length=" + tasks.length);
	var task = tasks[tasks.length-1];
	var me = this;
	task.amnt--;
	if (task.amnt <= 0) {
		tasks.pop();
	}
	this.save();
	console.log(tasks);
	if (tasks.length == 0) {
		if (mvc) {
			if (task.link == "search" && task.isMobileMode != mvc.isMobileMode) {
				// avoid refreshing forever
				return;
			}
		}
		// no more tasks, should check balance again
		chrome.tabs.update(me.tabid, {url: rewards_redirect_url}, function(tab) { if (tab.id==me.tabid) {
			me.pendingRefresh = 3;
			me.save();
			chrome.tabs.executeScript(me.tabid, rewards_inject);
		}});
	} else {
		// try to do another task
		this.doTasks();
	}
}}

function updateTabUrl(tabid, link, callback) {
	var listener = function(id, changeInfo, tab) {
		//alert("in listener: " + id + " " + tabid + " " + JSON.stringify(changeInfo));
		if (id == tabid && changeInfo.status == "complete") {
			chrome.tabs.onUpdated.removeListener(listener);
			callback(tab);
		}
	}
	chrome.tabs.onUpdated.addListener(listener);
	chrome.tabs.update(tabid, {url:link}, function(tab) {
		chrome.tabs.get(tabid, function(tab) {
			//alert(tab.url);
			console.log("updateTabUrl: " + tab.url);
			if (tab.url.startsWith("https://www.bing.com/rewards/dashboard")) {
				updateTabUrl(tab.id, link, callback);
			} else {
				//chrome.tabs.update(tab.id, {url:link}, callback);
			}
		});
	});
}

Navigator.prototype.doTasks = function() { if (this.tabid) {
	var tasks = this.tasks;
	var me = this;
	if (tasks && tasks.length > 0) {
		console.log("in doTasks: tasks.length=" + tasks.length);
		var task = tasks[tasks.length-1];
		console.log("in doTasks:");
		console.log(task);
		if (mvc) {
			if (task.link == "search" && task.isMobileMode != mvc.isMobileMode) {
				task.amnt = 0;
				this.taskDone();
				return;
			}
		}
		var link = (task.link == "search") ? ("http://www.bing.com/search?q=" + randomWord(this.keywords)) : task.link;
		updateTabUrl(me.tabid, link, function(tab) {
			console.log("url: " + tab.url);
			chrome.tabs.executeScript(tab.id, task_inject);
		});
	} else {
		// no tasks to do, close the tab
		//var tabid = me.tabid;
		//me.tabid = null;
		me.save(function() {
			//chrome.tabs.remove(tabid);
			mvc.completeRun(me.email, true);
		});
	}
}}

// Singleton
var navi = new Navigator();
navi.init();
