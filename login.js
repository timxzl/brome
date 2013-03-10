const email="email@hotmail.com";
const pass="pass";

var done = false;

function login() {
	if (!done && document.readyState == "complete") {
		done = true;
		delete document.onreadystatechange;
		var input_email = document.getElementsByName("login")[0];
		var input_pass = document.getElementsByName("passwd")[0];
		input_email.value = email;
		input_pass.value = pass;
		var sign_in = document.getElementsByName("SI")[0];
		sign_in.click();
	}
}

document.onreadystatechange = login;
login();
