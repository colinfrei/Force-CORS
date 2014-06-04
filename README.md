# Cors Injector

## Description

This simple extension adds the Cross Origin Resource Sharing (CORS) Access-Control- HTTP headers to responses to allow cross domain calls. The feature can be toggled on/off with a button in the status bar and headers can be customized in about:config/forcecors.headers.

This version also includes :
 - An Australis compatible toggle icon
 - A specific settings to automatically inject CORS when using a given referrer (ie. localhost).
   The addon icon will turn green during 2 seconds when it injects CORS using this mode

Warning: This extension essentially disables the browser's same origin policy which has serious security ramifications. Don't use it if you don't know what you're doing.


## Credits

Based on :
 - https://github.com/jo5ef/Force-CORS
 - https://github.com/colinfrei/Force-CORS
