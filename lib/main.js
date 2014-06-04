var ui = require("sdk/ui"),
    data = require("sdk/self").data,
    {Cc,Ci} = require("chrome"), // Pourquoi {Cc Ci} ??

    events = require("sdk/system/events");

var URL = require('sdk/url');
var Timers = require('sdk/timers');

// TODO Make it green during 3 seconds if cors has been automatically forced

var button = ui.ActionButton({
  id: "forcecors-button",
  label: "Force CORS",
  icon: "./force_cors_inactive.png",
  onClick: function(state){
    forcecors.toggle();
  }
})

function Forcecors() {
  this.enabled = false;
  var self = this;

  this.observer = function(event) {
    if(event.type == 'http-on-examine-response') {
      var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel);
      var headers = Forcecors.getHeaders();
      Forcecors.addHeadersToResponse(headers, httpChannel);
    }
  };

  var greenIconTimeout = null;

  this.autoObserver = function(event) {
    if(event.type == 'http-on-examine-response') {
      var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel);
      if (httpChannel.referrer != null
          && Forcecors.isAutoReferrer(Forcecors.getAutoReferrers(), httpChannel.referrer)) {
        var headers = Forcecors.getHeaders();
        Forcecors.addHeadersToResponse(headers, httpChannel);

        if (greenIconTimeout != null){
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
};

Forcecors.addHeadersToResponse = function(headers, request){
  for(var i = 0; i < headers.length; i++) {
    var keyValue = headers[i].split(' ');
    request.setResponseHeader(keyValue[0], keyValue[1], false);
  }
};

Forcecors.isAutoReferrer = function(referrers, currentReferrer){
  return referrers.some(function(ref){
    return ref === currentReferrer.host;
  });
}


Forcecors.getAutoReferrers = function(){
  var referrers = require("sdk/simple-prefs").prefs['auto-enabled-referrers'];

  if (referrers != null) {
    var refs = referrers.split('|');
    return refs;
  }

  return [];
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
    button.icon = "./force_cors.png";
   // widget.tooltip = 'CORS is currently forced';
  } else {
    button.icon = "./force_cors_inactive.png";
   // widget.tooltip = 'click to force CORS';
  }
};

Forcecors.prototype.toggle = function() {
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

var forcecors = new Forcecors();
forcecors.updateLabel();
