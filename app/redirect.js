var express = require('express');
var http = require('http');

var app = express.createServer();
app.listen(1337);
console.log('Connected...')

app.get('/', function(req, res) {
	// res.redirect('http://www.stoutapp.com/');
	res.redirect('http://192.168.1.200:1337/');
});

app.get('/dashboard', function(req, res) {
	// res.redirect('http://www.stoutapp.com/');
	res.redirect('http://192.168.1.200:1337/');
});