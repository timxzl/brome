var done = false;

function main() {
	console.log("in main " + done);
	if (!done && document.readyState == "complete") {
		done = true;
		const bal = parseInt(document.getElementById("id_rc").innerText);
		chrome.extension.sendMessage({balance: bal});
	}
}

document.onreadystatechange = main;
main();
