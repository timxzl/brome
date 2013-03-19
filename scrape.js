var done = false;

const WordRE = /[a-z]+/gi;

const MaxWords = 20;

function scrape() {
	const result = [];
	const pars = document.getElementsByClassName('sa_mc');
	for (var i=0; i<pars.length && i<10; i++) {
		var p = pars[i].getElementsByTagName('p');
		if (p && p.length>0) {
			var words = p.innerText.match(WordRE);
			for (int j=0; j<words.length && j<100; j++) {
				var w = words[j];
				if (result.length<MaxWords) {
					result.push(w);
				} else {
					if (Math.random()>0.9) {
						var i = Math.floor(Math.random()*(MaxWords-1));
						result[i] = w;
					}
				}
			}
		}
	}
}

const r = scrape();
console.log(r);
chrome.extension.sendMessage(r);
