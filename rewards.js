var done = false;
var ProgressRE = /([0-9]+)\s+of\s+([0-9]+)\s+credit/i;
var PerSearchRE = /per\s+([0-9]+)\s+Bing/i;

function getBalance() {
	var rc = document.getElementById("id_rc");
	if (rc) {
		return parseInt(rc.innerText);
	}
	var status = document.getElementById("user-status");
	if (status) {
		var data = document.getElementsByClassName("data-value-text");
		if (data) {
			var d = data[0];
			if (d) {
				return parseInt(d.innerText);
			}
		}
	}
	return -1;
}

function analyzeTask(elem, title, descText, progText) {
	console.log("title=" + title);
	if (title == "Connect to Facebook") {
	       return null;
	}
	if (title == "Invite friends" || title == "Maintain Gold") {
		return null;
	}
	console.log(progText);
	var progress = ProgressRE.exec(progText);
	if (!progress) {
		return null;
	}
	//console.log(progress);
	var times = parseInt(progress[2]) - parseInt(progress[1]);
	var lnk;
	var mobile = false;
	var mobileSearch = "Mobile search";
	if (title == "Search Bing" || title == "PC search" || title == "Today only!" || title == mobileSearch) {
		lnk = "search";
		mobile = (title == mobileSearch);
		if (title == "Today only!") { times *= 2; }
		{
			per = PerSearchRE.exec(descText);
			if (per) {
				times *= parseInt(per[1]);
			}
		}
	} else {
		lnk = elem.href;
	}
	console.log(lnk + " " + times);
	return {link: lnk, amnt: times, isMobileMode: mobile};
}

function analyzeTile(tile) {
	var title = tile.children[1].children[0].innerText;
	var progText = tile.children[3].innerText;
	return analyzeTask(tile, title, tile.children[1].children[1].innerText, progText);
}

function analyzeMsg(msg) {
	var title = msg.getElementsByClassName("offerTitle");
	//console.log(title);
	var desc = msg.getElementsByClassName("desc");
	//console.log(desc);
	var progress = msg.getElementsByClassName("progress");
	//console.log(progress);
	if (title && title.length > 0 && desc && desc.length > 0 && progress && progress.length > 0) {
		return analyzeTask(msg.parentElement, title[0].innerText, desc[0].innerText, progress[0].innerText);
	}
	return null;
}

function pushTask(task, info) {
	if (info) {
		if (info.link == "search") {
			task.splice(0,0,info);
		} else {
			task.push(info);
		}
	}
	//console.log(info);
	//console.log(task);
}

function main() {
	//alert("rewards main");
	//console.log("rewards main");
	if (!done && document.readyState == "complete") {
		done = true;
		var bal = getBalance();
		var task = [];
		var tiles = document.getElementsByClassName("tile rel blk tile-height");
		if (tiles && tiles.length > 0) {
			console.log("tiles.length=" + tiles.length);
			for (var i=0; i<tiles.length; i++) {
				var info = analyzeTile(tiles[i]);
				pushTask(task, info);
			}
		} else {
			var msgs = document.getElementsByClassName("message");
			//console.log(msgs);
			if (msgs) {
				for (var i = 0; i < msgs.length; i++) {
					var info = analyzeMsg(msgs[i]);
					//console.log("info= " + info);
					pushTask(task, info);
				}
			}
		}
		console.log(task);
	       	console.log(task[0] + " " + task.length);
		chrome.extension.sendMessage({balance: bal, tasks: task});
	}
}

//alert("rewards.js");
document.onreadystatechange = main;
main();
