var done = false;

const WordRE = /[a-z]{7,20}/g;

const MaxWords = 20;
const dict = {a:1, an:1, the: 1, that:1, 
I:1, we:1, my: 1, mine: 1, our:1, ours: 1, me: 1, us: 1,
you: 1, your: 1, yours: 1,
he: 1, she: 1, his: 1, her: 1, hers: 1, him: 1,
they: 1, their: 1, theirs: 1, them: 1,
and:1, or:1, not: 1,
on: 1, of: 1, by: 1, to: 1, into: 1, onto: 1,
take: 1, get: 1, make: 1,
such: 1, any:1, for: 1, exist: 1, exists: 1, all: 1, none: 1,
one: 1, two: 1, three: 1, four: 1, five: 1, six: 1, many: 1,
american: 1};
dict['this'] = 1;
dict['in'] = 1;

function scrape() {
	const result = [];
	// avoid words in dict

	const pars = document.getElementsByClassName('sa_mc');
	if (!pars) {
		return [];
	}
	for (var i=0; i<pars.length && i<10; i++) {
		var p = pars[i].getElementsByTagName('p');
		if (p && p.length>0) {
			var words = p[0].innerText.toLowerCase().match(WordRE);
			for (var j=0; j<words.length && j<100; j++) {
				var w = words[j];
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
	const item = {type: 'task', words: scrape()};
	console.log(item.words);
	chrome.extension.sendMessage(item, function(reply) {
		// reply is delay
		console.log(reply);
		window.setTimeout(function() {
			console.log('taskDone');
			chrome.extension.sendMessage({type: 'taskDone'});
		}, reply);
	});
}

task();