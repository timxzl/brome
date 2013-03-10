var done = false;

console.log("here");

function search() {
	if (!done && document.readyState == "complete") {
		done = true;
		delete document.onreadystatechange;
	}
}

document.onreadystatechange = search;
search();
