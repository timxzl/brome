var done = false;

function login() {
	if (!done && document.readyState == "complete") {
		done = true;
		delete document.onreadystatechange;
		var input_email = document.getElementsByName("login")[0];
		var input_pass = document.getElementsByName("passwd")[0];
		chrome.extension.sendMessage("login", function(r) {
			input_email.value = r.e;
			input_pass.value = r.p;
			var sign_in = document.getElementsByName("SI")[0];
			sign_in.click();
		});
	}
}

document.onreadystatechange = login;
login();
