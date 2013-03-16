var done = false;

function main() {
	if (!done && document.readyState == "complete") {
		done = true;
		chrome.extension.sendMessage("passport");
	}
}

document.onreadystatechange = main;
main();
