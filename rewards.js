var done = false;
const ProgressRE = /([0-9]+)\s+of\s+([0-9]+)\s+credit/i;
const PerSearchRE = /per\s+([0-9]+)\s+Bing/i;

function getBalance() {
	return parseInt(document.getElementById("id_rc").innerText);
}

function analyzeTile(tile) {
	var title = tile.children[1].children[0].innerText;
	console.log("title=" + title);
	if (title == "Connect to Facebook") {
	       return null;
	}
	if (title == "Invite friends" || title == "Mobile search") {
		return null;
	}
	const progText = tile.children[3].innerText;
	console.log(progText);
	const progress = ProgressRE.exec(progText);
	if (!progress) {
		return null;
	}
	console.log(progress);
	var times = parseInt(progress[2]) - parseInt(progress[1]);
	var lnk;
	if (title == "Search Bing" || title == "PC search" || title == "Today only!") {
		lnk = "search";
		if (title == "Today only!") { times *= 2; } else {
			per = PerSearchRE.exec(tile.children[1].children[1].innerText);
			if (per) {
				times *= parseInt(per[1]);
			} else {
				return null;
			}
		}
	} else {
		lnk = tile.href;
	}
	console.log(lnk + " " + times);
	return {link: lnk, amnt: times};
}


function main() {
	//alert("rewards main");
	console.log("rewards main");
	if (!done && document.readyState == "complete") {
		done = true;
		const bal = getBalance();
		const tiles = document.getElementsByClassName("tile rel blk tile-height");
		const task = [];
		console.log("tiles.length=" + tiles.length);
		for (var i=0; i<tiles.length; i++) {
			var info = analyzeTile(tiles[i]);
			if (info) {
				if (info.link == "search") {
					task.splice(0,0,info);
				} else {
					task.push(info);
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
