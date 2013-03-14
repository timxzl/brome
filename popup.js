const bg = chrome.extension.getBackgroundPage();
const mvc = bg.mvc;

window.onload =  function() {
	mvc.setView(document);
}
