var done = false;

function main() {
	//alert("passport main");
	if (!done && document.readyState == "complete") {
		done = true;
		chrome.extension.sendMessage("passport");
	}
}

//alert("passport.js");
document.onreadystatechange = main;
main();
