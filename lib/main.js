var ui = require("sdk/ui"),
    data = require("sdk/self").data,
    {Cc,Ci} = require("chrome"),
    events = require("sdk/system/events");

var URL = require('sdk/url');
var Timers = require('sdk/timers');

var button = ui.ActionButton({
  id: "injectcors-button",
  label: "Inject CORS",
  icon: "./force_cors_inactive.png",
  onClick: function(state){
    injectcors.toggle();
  }
});

function InjectCors() {
  this.enabled = false;
  var self = this;

  this.observer = function(event) {
    if(event.type == 'http-on-examine-response') {
      var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel);
      var headers = InjectCors.getHeaders();
      InjectCors.addHeadersToResponse(headers, httpChannel);
    }
  };

  var greenIconTimeout = null;

  this.autoObserver = function(event) {
    if(event.type == 'http-on-examine-response') {
      var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel);
      if (httpChannel.referrer !== null &&
          InjectCors.isAutoReferrer(InjectCors.getAutoReferrers(), httpChannel.referrer)) {
        var headers = InjectCors.getHeaders();
        InjectCors.addHeadersToResponse(headers, httpChannel);

        if (greenIconTimeout !== null){
          Timers.clearTimeout(greenIconTimeout);
        }

        greenIconTimeout = Timers.setTimeout(function(){
            button.icon = "./force_cors_inactive.png";
        }, 2000);

        button.icon = "./force_cors_auto.png";
      }

    }
  };

  events.on('http-on-examine-response', this.autoObserver);
}

InjectCors.addHeadersToResponse = function(headers, request){
  for(var i = 0; i < headers.length; i++) {
    var keyValue = headers[i].split(' ');
    request.setResponseHeader(keyValue[0], keyValue[1], false);
  }
};

InjectCors.isAutoReferrer = function(referrers, currentReferrer){
  return referrers.some(function(ref){
    return ref === currentReferrer.host;
  });
};


InjectCors.getAutoReferrers = function(){
  var referrers = require("sdk/simple-prefs").prefs['auto-enabled-referrers'];

  if (referrers !== null) {
    var refs = referrers.split('|');
    return refs;
  }

  return [];
};


InjectCors.getHeaders = function() {
  var headers = require("sdk/simple-prefs").prefs.headers;

  if(headers !== null) {
    if(headers.indexOf('|') === -1) {
      // migrate old config
      headers = headers.replace(/ /, '|');
      headers = headers.replace(/:/, ' ');
      prefs.setCharPref('injectcors.headers', headers);
    }

    return headers.split('|');
  }

  return [];
};

InjectCors.prototype.updateLabel = function() {

  if(this.enabled) {
    button.icon = "./force_cors.png";
  } else {
    button.icon = "./force_cors_inactive.png";
  }
};

InjectCors.prototype.toggle = function() {
  if(this.enabled) {
    events.on('http-on-examine-response', this.autoObserver);
    events.off('http-on-examine-response', this.observer);
  } else {
    events.on('http-on-examine-response', this.observer);
    events.off('http-on-examine-response', this.autoObserver);
  }
  this.enabled = !this.enabled;
  this.updateLabel();
};

var injectcors = new InjectCors();
injectcors.updateLabel();
