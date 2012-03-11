var express = require('express');
				
var static = require('node-static');
var jade = require('jade');
var OAuth = require('oauth').OAuth;
var url = require('url');
var fs = require('fs');
var http = require('http');
var $ = require('jquery');
var request = require('request');
var crypto = require('crypto');
var base64 = require('base64');

// CSS ---------------------------------------------------
var less = require('less');
var parser = new (less.Parser)({
    paths: ['.', './views/css'], // Specify search paths for @import directives
    filename: 'style.less' // Specify a filename, for better error messages
});

parser.parse('.class { width: 1 + 1 }', function (e, tree) {
    tree.toCSS({ compress: true }); // Minify CSS output
});

var app = express.createServer( 
				express.static(__dirname + '/views'),
				express.cookieParser(),
				express.session({secret: 'FlurbleGurgleBurgle',
				                store: new express.session.MemoryStore({ reapInterval: -1 }) }));
//app.listen(1337);
app.listen(80);

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err.stack);
});



console.log('Connected...');