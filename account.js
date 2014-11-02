var rewards_url = "http://www.bing.com/rewards/dashboard";

var done = false;

function redirect() {
	//alert("account.js main");
	if (!done && document.readyState == "complete") {
		//alert("redirect");
		done = true;
		delete document.onreadystatechange;
		document.location = rewards_url;
	}
}

document.onreadystatechange = redirect;
redirect();
