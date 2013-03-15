var done = false;

function login() {
	if (!done && document.readyState == "complete") {
		done = true;
		delete document.onreadystatechange;
		const input_email = document.getElementsByName("login")[0];
		const input_pass = document.getElementsByName("passwd")[0];
		chrome.extension.sendMessage("login", function(r) {
			console.log(r);
			input_email.value = r.e;
			input_pass.value = r.p;
			const sign_in = document.getElementsByName("SI")[0];
			sign_in.click();
		});
	}
}

document.onreadystatechange = login;
login();
