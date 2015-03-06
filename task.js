var loaded = false;

var WordRE = /[a-z]{7,20}/g;

var MaxWords = 20;
// avoid words in dict
var dict = {a:1, an:1, the: 1, that:1, 
I:1, we:1, my: 1, mine: 1, our:1, ours: 1, me: 1, us: 1,
you: 1, your: 1, yours: 1,
he: 1, she: 1, his: 1, her: 1, hers: 1, him: 1,
they: 1, their: 1, theirs: 1, them: 1,
and:1, or:1, not: 1,
on: 1, of: 1, by: 1, to: 1, into: 1, onto: 1,
take: 1, get: 1, make: 1,
such: 1, any:1, for: 1, exist: 1, exists: 1, all: 1, none: 1,
one: 1, two: 1, three: 1, four: 1, five: 1, six: 1, many: 1,
american: 1
};
dict['this'] = 1;
dict['in'] = 1;

function scrape() {
	var result = [];
	// avoid words in dict
	console.log("scrape: " + window.location.href);

	var pars = document.getElementsByClassName('b_caption');
	if (!pars) {
		return [];
	}
	console.log(pars);
	for (var i=0; i<pars.length && i<10; i++) {
		var p = pars[i].getElementsByTagName('p');
		console.log(pars);
		if (!p) {
			continue;
		}
		if (p.length>0) {
			console.log(p[0]);
			var words = p[0].innerText.toLowerCase().match(WordRE);
			if (!words) {
				continue;
			}
			for (var j=0; j<words.length && j<100; j++) {
				var w = words[j];
				console.log(w);
				//if (w.length<7) {
				//	alert(w);
				//}
				if (dict.hasOwnProperty(w)) {
					continue;
				}
				if (result.length<MaxWords) {
					result.push(w);
					dict[w] = true;
				} else {
					if (Math.random()>0.9) {
						var k = Math.floor(Math.random()*(MaxWords-1));
						result[k] = w;
						dict[w] = true;
					}
				}
			}
		}
	}
	return result;
}


function task() {
        console.log("start scrape");
	var w = scrape();
	console.log(w);
	var item = {type: 'task', words: w};
	console.log("about to send message");
	chrome.extension.sendMessage(item, function(reply) {
		// reply is delay
		console.log("delay: " + reply);
		window.setTimeout(function() {
			console.log('taskDone');
			chrome.extension.sendMessage({type: 'taskDone'});
		}, reply);
	});
}

function main() {
	console.log("in main: " + document.readyState + " " + window.location.href);
	if (!loaded && document.readyState == "complete") {
		loaded = true;
		task();
	}
}

console.log("in task.js");
document.onreadystatechange = main;
main();
