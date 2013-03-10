const rewards_url = "http://www.bing.com/rewards";

var done = false;

function redirect() {
	if (!done && document.readyState == "complete") {
		done = true;
		delete document.onreadystatechange;
		document.location = rewards_url;
	}
}

document.onreadystatechange = redirect;
redirect();
