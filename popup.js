var mvc = null;
var view = null;

chrome.runtime.getBackgroundPage(function(bg) {
	mvc = bg.mvc;
	if (view) {
		mvc.setView(view);
	}
});

window.onload = function() {
	view = document;
	if (mvc) {
		mvc.setView(document);
	}
}
