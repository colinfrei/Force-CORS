var widgets = require("sdk/widget"),
    data = require("sdk/self").data,
    {Cc, Ci} = require("chrome"),
    events = require("sdk/system/events");

var widget = widgets.Widget({
    id: "forcecors-button",
    label: "Force CORS",
    content: "cors",
    width: 33,
    onClick: function() {
        forcecors.toggle();
    }
});

function Forcecors() {
        this.enabled = false;
        this.observer = function(event) {
		if(event.type == 'http-on-examine-response') {
                        var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel);
                        var headers = Forcecors.getHeaders();
                        for(var i = 0; i < headers.length; i++) {
                                var keyValue = headers[i].split(' ');
                                httpChannel.setResponseHeader(keyValue[0], keyValue[1], false);
                        }
	        }
        };
};

Forcecors.getHeaders = function() {
	var headers = require("sdk/simple-prefs").prefs['headers'];

	if(headers != null) {
                if(headers.indexOf('|') === -1) {
                        // migrate old config
                        headers = headers.replace(/ /, '|');
                        headers = headers.replace(/:/, ' ');
                        prefs.setCharPref('forcecors.headers', headers);
                }

                return headers.split('|');
        }

        return [];
};

Forcecors.prototype.updateLabel = function() {
	if(this.enabled) {
		widget.content = '<span style="color: red;">CORS!</span>';
		widget.label = 'CORS';
		widget.tooltip = 'CORS is currently forced';
	} else {
		widget.content = '<span>cors</span>';
		widget.label = 'cors';
		widget.tooltip = 'click to force CORS';
	}
};

Forcecors.prototype.toggle = function() {
        if(this.enabled) {
		events.off('http-on-examine-response', this.observer);
        } else {
		events.on('http-on-examine-response', this.observer);
        }
        this.enabled = !this.enabled;
	this.updateLabel();
};

var forcecors = new Forcecors();
forcecors.updateLabel();
