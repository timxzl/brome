const WordRE = /[a-z]+/gi;

const MaxWords = 20;

function scrape() {
	const result = [];
	const pars = document.getElementsByClassName('sa_mc');
	for (var i=0; i<pars.length && i<10; i++) {
		var p = pars[i].getElementsByTagName('p');
		if (p && p.length>0) {
			var words = p[0].innerText.match(WordRE);
			for (var j=0; j<words.length && j<100; j++) {
				var w = words[j];
				if (result.length<MaxWords) {
					result.push(w);
				} else {
					if (Math.random()>0.9) {
						var k = Math.floor(Math.random()*(MaxWords-1));
						result[k] = w;
					}
				}
			}
		}
	}
	return result;
}

const r = scrape();
//console.log(r);
if (r.length>0) {
	chrome.extension.sendMessage(r);
}

