function speak(text, callback) {
    var u = new SpeechSynthesisUtterance();
    u.text = text;
    u.lang = 'en-US';
    u.voice = ''
 
    u.onend = function () {
        if (callback) {
            callback();
        }
    };
 
    u.onerror = function (e) {
        if (callback) {
            callback(e);
        }
    };
 
    speechSynthesis.speak(u);
}