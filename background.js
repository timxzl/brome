const login_url = "https://login.live.com";
const account_url = "https://account.live.com";
const rewards_url = "http://www.bing.com/rewards";

const login_tab_prop = {"url": login_url};
const login_inject = {"file": "login.js", "runAt": "document_idle"};

const account_inject = {"file": "account.js", "runAt": "document_idle"};
const rewards_inject = {"file": "rewards.js", "runAt": "document_idle"};

//const after_inject = {"code": "alert('hahaha' + document.URL + ' ' + document.readyState)", "runAt": "document_idle"};

var to_redirect = {};

chrome.tabs.onUpdated.addListener(function(id, info, tab) {
	//chrome.tabs.executeScript(id, after_inject);
	if (to_redirect[id]) {
		var url = info.url;
		if (url.indexOf(account_url)>=0) {
			//delete to_redirect[id];
			chrome.tabs.executeScript(id, account_inject);
		} else if (url.indexOf(rewards_url)>=0) {
			chrome.tabs.executeScript(id, rewards_inject);
		}
	}
});

chrome.browserAction.onClicked.addListener(function(_ignore) {
	chrome.tabs.create(login_tab_prop, function(tab) {
		var tabid = tab.id;
		to_redirect[tabid] = true;
		chrome.tabs.executeScript(tabid, login_inject);
	})
});

