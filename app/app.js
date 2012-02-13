var express = require('express');
				
var static = require('node-static');
var jade = require('jade');
var OAuth = require('oauth').OAuth;
var url = require('url');
var fs = require('fs');
var http = require('http');
var $ = require('jquery');
var base64 = require('base64');
var request = require('request');
var crypto = require("crypto");

var time = new Date();
var current = dateToString(time);

// CSS ---------------------------------------------------
var less = require('less');
var parser = new(less.Parser)({
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
// var everyone = require("now").initialize(app);
app.listen(1337);
//app.listen(80);

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err.stack);
});

app.use(express.compiler({ src: __dirname + '/views', enable: ['less'] }));
app.use('/css', express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.enable('jsonp callback');

// COMMON FUNCTIONS --------------------------------------

function checkAuth(req, res, next) {
	if (!req.session.user_name) {
		delete req.session.user_name;
		delete req.session.user_id;
		console.log('attempted to redirect to index...');
		res.redirect('/');
	} else {
		next();
	}
}

function hasNumbers(t) {
	var regex = /\d/g;
	return regex.test(t);
}

// DATABASE INFO -----------------------------------------
var mysql = require('mysql'),
	database = 'stout',
	user_table = 'users',
	client = mysql.createClient({ user: 'sterlingrules', password: '@y&7~s45', host: 'mysql.mynameissterling.com', port: 3306 });
	client.query('USE ' + database);
	client.database = 'stout';

// var mysql = require('mysql'),
// 	database = 'beer',
// 	user_table = 'users',
// 	client = mysql.createClient({ user: 'root', password: '' });
// 	client.query('USE ' + database);
// 	client.database = 'beer';

// OAUTH SETUP --------------------------------------------
var oa = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	"Nmqm7UthsfdjaDQ4HcxPw",
	"PIFvIPSXlTIbqnnnjBIqoWs0VIxpQivNrIJuWxtkLI",
	"1.0",
	//"http://localhost:1337/auth/twitter/callback",
	//"http://stoutapp.com:1337/auth/twitter/callback",
	"http://ps79519.dreamhostps.com:1337/auth/twitter/callback",
	"HMAC-SHA1"
);

function dateToString(date){ 
	//check that date is a date object 
	if (date && date.getFullYear()){ 
		return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();
	} 
	return ""; 
}

app.get('/', function(req, res) {
	console.log(req.session.user_name);
	if (req.session.user_name != undefined) {
		res.redirect('/dashboard');
	} else {
		res.render('index', { user_name: '', user_id: '', title: 'Stout' });
	}
});

app.get('/logged', function(req, res) {
	console.log('req.query.user_name: ' + req.query.user_name);
	if (req.query.user_name != undefined) {
		req.session.user_name = req.query.user_name;
		req.session.user_id = req.query.user_id;
		console.log('req.session.user_name: ' + req.session.user_name);
		console.log('req.session.user_id: ' + req.session.user_id);
		res.json({'status':'success'});
	} else {
		return false;
	}
});

app.get('/dashboard', checkAuth, function(req, res) {
	console.log(req.session.user_name);
	console.log(req.session.user_id);
	res.render('dashboard', { user_name: req.session.user_name, user_id: req.session.user_id, title: 'Stout' });
});

app.get('/get-feed', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	client.query(
		'SELECT DISTINCT feed.id, feed.user_name, feed.user_id, feed.beer_id, feed.rating, feed.comment_count, feed.type, ROUND(TIMESTAMPDIFF(SECOND,feed.created_date,"' + current + '")/60) AS time, users.first_name, users.last_name, users.avatar, beers.name AS beer_name, comment '
		+ 'FROM feed, beers, users, followers '
		+ 'WHERE ((feed.user_id = users.user_id) AND (feed.beer_id = beers.id)) AND (((followers.owner_id = feed.user_id) AND (followers.follower_id = ' + req.session.user_id + ')) '
		+ 'OR ((feed.user_id = ' + req.session.user_id + '))) '
		+ 'ORDER BY feed.created_date DESC LIMIT ' + req.query.limit + ',10 ',
		function(err, results, field) {
			if (err) throw err;
			if (results != undefined) {
				console.log(results);
				res.send(results);
			}
		});
});

app.get('/get-comments', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	client.query(
		'SELECT DISTINCT comments.owner_id, comments.partner_id, comments.rating, comments.beer_id, beers.name, beers.description, comments.comment, comments.created_date, ROUND(TIMESTAMPDIFF(SECOND,comments.created_date,"' + current + '")/60) AS time, users.avatar, users.first_name, users.last_name '
		+ 'FROM comments, users, beers '
		+ 'WHERE comments.feed_id = ' + req.query.id + ' AND comments.partner_id = users.user_id AND comments.beer_id = beers.id ORDER BY comments.created_date',
		function(err, results, field) {
			if (err) throw err;
			console.log(results);
			if (results == '') {
				client.query(
					'SELECT feed.user_id, feed.beer_id, feed.rating, beers.name, beers.description, users.first_name, users.last_name, users.avatar, feed.created_date '
					+ 'FROM feed, beers, users WHERE feed.id = ' + req.query.id + ' AND feed.beer_id = beers.id AND feed.user_id = users.user_id',
					function(err, results, field) {
						if (err) throw err;
						console.log('second sql query');
						console.log(results);
						res.send(results);
				});
			} else {
				res.send(results);
			}
	});
});

app.get('/find-beer', checkAuth, function(req, res) {
	console.log('search term: ' + req.query.beer_name);
	client.query(
		'SELECT beers.name, breweries.name AS brewery, beers.id, brewery_id, beers.description FROM beers, breweries WHERE (beers.brewery_id = breweries.id) AND beers.name LIKE "%' + req.query.beer_name + '%" LIMIT 0,10;',
		function(err, sql_results, fields) {
			if (err) throw err;
			if (sql_results != undefined) {
				console.log(sql_results);
				res.send(sql_results);
			}
		});
});

app.get('/beer-detail', checkAuth, function(req, res) {
	client.query(
		'SELECT beers.name, beers.description, beers.abv, beers.love, beers.like, beers.meh, beers.dislike, beers.last_mod, breweries.name AS brewery, categories.cat_name, styles.style_name, feed.rating, todrink.id AS addtodrink '
		+ 'FROM beers, breweries, categories, styles '
		+ 'LEFT OUTER JOIN todrink ON (todrink.user_id = ' + req.session.user_id + ' AND todrink.beer_id = ' + req.query.beer_id + ') '
		+ 'LEFT OUTER JOIN feed ON (feed.user_id = ' + req.session.user_id + ' AND feed.beer_id = ' + req.query.beer_id + ') '
		+ 'WHERE (beers.id = ' + req.query.beer_id + ') AND (beers.brewery_id = breweries.id) AND (beers.cat_id = categories.id) AND (beers.style_id = styles.id) '
		+ 'ORDER BY beers.last_mod DESC',
		function(err, results, field) {
			if (err) throw err;
			console.log(results);
			res.send(results);
		});
});

app.get('/get-breweries', checkAuth, function(req, res) {
	client.query(
		'SELECT name, id AS value FROM breweries',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});
app.get('/get-beer-categories', checkAuth, function(req, res) {
	client.query(
		'SELECT * FROM categories',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});
app.get('/get-beer-styles', checkAuth, function(req, res) {
	client.query(
		'SELECT * FROM styles WHERE cat_id = ' + req.query.cat_id,
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});

// CREATES NEW BEERS
app.get('/new-beer', checkAuth, function(req, res) {
	
	var name = req.query.name;
	var brewery = req.query.brewery;
	var description = req.query.description;
	var category = req.query.category;
	var style = req.query.style;
	var abv = req.query.abv;
	var time = new Date();
	var current = dateToString(time);
	
	if (!hasNumbers(req.query.brewery)) { // Checks if new brewery
		console.log(req.query.brewery);
		client.query( // If new brewery, add it to database
			'INSERT INTO breweries ' +
			'SET name = ?, last_mod = ?',
			[req.query.brewery, current],
			function(err, results, fields) {
				if (err) throw err;
				console.log(results);
				brewery = results.insertId;
				client.query( // add new brewery with id to new beer
					'INSERT INTO beers ' +
					'SET name = ?, brewery_id = ?, description = ?, cat_id = ?, style_id = ?, abv = ?, last_mod = ?, creator_id = ?, creator_name = ?',
					[name, brewery, description, category, style, abv, current, req.session.user_id, req.session.user_name],
					function(err, results, fields) {
						if (err) throw err;
						console.log(results.insertId);
						res.json({"status":"success", "id":results.insertId});
				});
		});
	} else { // if there's already a brewery in our database
		client.query( // add new beer to database
			'INSERT INTO beers ' +
			'SET name = ?, brewery_id = ?, description = ?, cat_id = ?, style_id = ?, abv = ?, last_mod = ?',
			[name, brewery, description, category, style, abv, current],
			function(err, results, fields) {
				if (err) throw err;
				console.log(results);
				res.json({"status":"success", "id":results.insertId});
		});
	}
});

// CHECKING IN
app.get('/beer-checkin', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	console.log('beerid: ' + req.query.beer_id);
	var unrate = '';
	if (req.query.unrate != '') {
		var unrate = ', beers.' + req.query.unrate + ' = beers.' + req.query.unrate + ' - 1';
		client.query('DELETE FROM feed WHERE (feed.user_id = ' + req.session.user_id + ') AND (feed.beer_id = ' + req.query.beer_id + ')');
	}
	client.query(
		'UPDATE beers SET beers.' + req.query.rate + ' = beers.' + req.query.rate + ' + 1' + unrate + ' WHERE id = ' + req.query.beer_id + ';',
		function(err, sql_results, fields) {
			if (err) throw err;
			if (sql_results != undefined) {
				console.log(sql_results);
				var rate = '';
				switch(req.query.rate) {
					case 'love':
						rate = 1;
						break;
					case 'like':
						rate = 2;
						break;
					case 'meh':
						rate = 3;
						break;
					case 'dislike':
						rate = 4;
						break;
				}
				client.query(
					'INSERT INTO feed ' +
					'SET user_id = ?, user_name = ?, beer_id = ?, type = ?, rating = ?, created_date = ? ',
					[req.session.user_id, req.session.user_name, req.query.beer_id, "RATE", rate, current],
					function(err, results, fields) {
						if (err) throw err;
						console.log(results);
						res.json({"status":"success", "feed_id": results.insertId, "beer_id": req.query.beer_id, "rate":rate });
					}
				);
			} else {
				res.json({"status":"failure"});
			}
		});
});

app.get('/add-to-drink-list', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	if (!req.query.removeList) {
		console.log(req.query.removeList);
		client.query( // Removes record from ToDrink table
			'DELETE FROM todrink WHERE beer_id = ' + req.query.beer_id + ' AND user_id = ' + req.session.user_id,
			function(err, results, fields) {
				if (err) throw err;
				console.log(results);
				client.query( // Removes record from Feed table
					'DELETE FROM feed WHERE beer_id = ' + req.query.beer_id + ' AND user_id = ' + req.session.user_id + ' AND type = "LIST"',
					function(err, results, fields) {
						if (err) throw err;
						console.log(results);
						res.json({"status":"success"});
				});
		});
	} else {
		console.log(req.query.removeList);
		client.query(
			'INSERT INTO todrink ' +
			'SET beer_id = ?, user_id = ?, user_name = ?, created_date = ?',
			[req.query.beer_id, req.session.user_id, req.session.user_name, current],
			function(err, results, fields) {
				if (err) throw err;
				console.log(results);
				client.query(
					'INSERT INTO feed ' +
					'SET user_id = ?, user_name = ?, beer_id = ?, type = ?, created_date = ? ',
					[req.session.user_id, req.session.user_name, req.query.beer_id, "LIST", current],
					function(err, results, fields) {
						if (err) throw err;
						console.log(results);
						res.json({"status":"success"});
					}
				);
		});
	}
});

app.get('/share-beer', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	client.query(
		'INSERT INTO comments ' +
		'SET feed_id = ?, owner_id = ?, partner_id = ?, beer_id = ?, rating = ?, comment = ?, created_date = ?',
		[req.query.feed_id, req.session.user_id, req.session.user_id, req.query.beer_id, req.query.rating, req.query.comment, current],
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			client.query(
				'UPDATE feed SET comment = "' + req.query.comment + '", comment_count = 1 WHERE feed.id = ' + req.query.feed_id + ';',
				function(err, results, fields) {
					if (err) throw err;
					res.json({"status":"success"});
				});
		});
});

app.get('/add-comment', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	client.query(
		'INSERT INTO comments ' +
		'SET feed_id = ?, owner_id = ?, partner_id = ?, beer_id = ?, rating = ?, comment = ?, created_date = ?',
		[req.query.feed_id, req.query.owner_id, req.session.user_id, req.query.beer_id, req.query.rating, req.query.comment, current],
		function(err, sql_results, fields) {
			if (err) throw err;
			console.log(sql_results);
			client.query('UPDATE feed SET feed.comment_count = feed.comment_count + 1 WHERE feed.id = ' + req.query.feed_id,
				function(err, results, fields) {
					if (err) throw err;
					console.log(results);
					client.query(
						'SELECT users.user_id, users.first_name, users.last_name, users.avatar FROM users WHERE users.user_id = ' + req.session.user_id + ';', // change to store these in the session
						function(err, results, fields) {
							console.log(results);
							res.send(results);
					});
			});
		});
});

// app.get('/find-friend', checkAuth, function(req, res) {
// 	
// 	client.query(
// 		'SELECT access_token, access_token_secret FROM users WHERE user_id = ' + req.session.user_id,
// 		function(err, results, fields) {
// 			if (err) throw err;
// 			
// 			var oauth_token = '68529291-pm3SERe2nrCHbtTKR4j7Tit2PSCfeOgyVTfjtbAhI';
// 			var oauth_token_secret = 'JCYBPGTsQA1ctdNIaIG8Mxi7zMTXhD4zwhgBj3Hgg';
// 	
// 			// Twitter stuff
// 			var consumer_key = 'Nmqm7UthsfdjaDQ4HcxPw';
// 			var consumer_secret = '19cnrCnCH8C7bn7xxvXl1N4jVWPtIvTZjJ8zbBthSS0';
// 
// 			var consumer_secret_encode = encodeURIComponent(consumer_secret);
// 			var oauth_token_secret_encode = encodeURIComponent(oauth_token_secret);
// 
// 			var signing_key = consumer_secret_encode + '&' + oauth_token_secret_encode;
// 	
// 			// ----
// 	
// 			var timestamp = Math.round((new Date()).getTime() / 1000);
// 			var time = new Date();
// 			var current = dateToString(time);
// 			var parameter_string = 'include_entities=true&oauth_consumer_key=' + consumer_key
// 									+ '&oauth_nonce=' + base64.encode(current)
// 									+ '&oauth_signature_method=HMAC-SHA1'
// 									+ '&oauth_timestamp=' + timestamp
// 									+ '&oauth_token=' + oauth_token
// 									+ '&oauth_version=1.0';
// 			var signature_base = encodeURIComponent(parameter_string);
// 			var url_encode = encodeURIComponent('https://api.twitter.com/1/friendships/lookup.json');
// 			var oauth_signature = 'POST&' + url_encode + '&' + signature_base;
// 	
// 			var hmac = crypto.createHmac("sha1", signing_key);
// 			var signature = hmac.update(oauth_signature);
// 			var digest = hmac.digest("base64");
// 
// 			console.log('search term: ' + req.query.user_name);
// 			console.log('parameter_string: ' + parameter_string);
// 			console.log('oauth_signature: ' + oauth_signature);
// 			
// 			client.query(
// 				'SELECT DISTINCT users.user_name, users.first_name, users.last_name, users.user_id, users.avatar FROM users WHERE users.user_name LIKE "%' + req.query.user_name + '%" OR users.full_name LIKE "%' + req.query.user_name + '%" ORDER BY users.created_date DESC LIMIT 0,10;',
// 				function(err, results, fields) {
// 					if (err) throw err;
// 			
// 					request.post({
// 							url: 'https://api.twitter.com/1/friendships/lookup.json?screen_name=' + req.session.user_name,
// 							headers: {
// 								'Content-Type': 'application/json',
// 								'Authorization': 'OAuth oauth_consumer_key="' + consumer_key + '", '
// 											+ 'oauth_nonce="' + base64.encode(current) + '", '
// 											+ 'oauth_signature="' + digest + '", '
// 											+ 'oauth_signature_method="HMAC-SHA1", '
// 											+ 'oauth_timestamp="' + timestamp + '", '
// 											+ 'oauth_token="' + oauth_token + '", '
// 											+ 'oauth_version="1.0"'
// 							}
// 						}, function(error, response, body){
// 							console.log(body);
// 							res.json({"status":"success"});
// 					});
// 			
// 					console.log(results);
// 					// res.send(results); -- uncomment after twitter testing
// 			});
// 		
// 	});
// });

app.get('/find-friend', checkAuth, function(req, res) {	
	console.log('search term: ' + req.query.user_name);
	client.query(
		'SELECT DISTINCT users.user_name, users.first_name, users.last_name, users.user_id, users.avatar FROM users WHERE users.user_name LIKE "%' + req.query.user_name + '%" OR users.full_name LIKE "%' + req.query.user_name + '%" ORDER BY users.created_date DESC LIMIT 0,10;',
		function(err, results, fields) {
			if (err) throw err;			
			console.log(results);
			res.send(results);
	});
});


// PROFILE -------------------------------------------------

app.get('/get-profile', checkAuth, function(req, res) {
	var user_id = req.query.user_id;
	console.log('profile for user id: ' + user_id);
	client.query(
		'SELECT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name, beer_number.beer_count, follows.follower_count, following.following_count, todrink_number.todrink_count, followers.created_date '
		+ 'FROM users, feed, beers, '
		+ '(SELECT COUNT(todrink.user_id) AS todrink_count FROM todrink WHERE todrink.user_id = ' + req.query.user_id + ') AS todrink_number, '
		+ '(SELECT COUNT(feed.beer_id) AS beer_count FROM feed WHERE user_id = ' + req.query.user_id + ' AND feed.type = "RATE") AS beer_number, '
		+ '(SELECT COUNT(owner_id) AS follower_count FROM followers WHERE owner_id = ' + req.query.user_id + ') AS follows, '
		+ '(SELECT COUNT(follower_id) AS following_count FROM followers WHERE follower_id = ' + req.query.user_id + ') AS following '
		+ 'LEFT OUTER JOIN followers ON (follower_id = ' + req.session.user_id + ') AND (owner_id = ' + req.query.user_id + ') '
		+ 'WHERE (users.user_id = ' + user_id + ') AND (feed.user_id = ' + user_id + ') AND (feed.beer_id = beers.id) AND (feed.type = "RATE") ORDER BY feed.created_date DESC;',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});

app.get('/get-to-drink-list', checkAuth, function(req, res) {
	client.query(
		'SELECT todrink.beer_id, todrink.user_id, beers.name AS beer_name, breweries.name AS brewery '
		+ 'FROM todrink, beers, breweries '
		+ 'WHERE todrink.beer_id = beers.id AND beers.brewery_id = breweries.id AND todrink.user_id = ' + req.query.user_id,
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});

app.get('/get-activity', checkAuth, function(req, res) {
	client.query(
		'SELECT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name '
		+ 'FROM users, feed, beers '
		+ 'WHERE (users.user_id = ' + req.query.user_id + ') AND (feed.user_id = ' + req.query.user_id + ') AND (feed.beer_id = beers.id) AND (feed.type = "RATE") ORDER BY feed.created_date DESC;',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});

app.get('/get-followers', checkAuth, function(req, res) {
	client.query(
		'SELECT DISTINCT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name '
		+ 'FROM users, feed, beers, followers '
		+ 'WHERE (followers.owner_id = ' + req.query.user_id + ') AND (followers.follower_id = users.user_id) AND (feed.user_id = users.user_id) AND (feed.beer_id = beers.id) AND (feed.type = "RATE") GROUP BY users.user_name ORDER BY feed.created_date DESC;',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});

app.get('/get-following', checkAuth, function(req, res) {
	client.query(
		'SELECT DISTINCT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name '
		+ 'FROM users, feed, beers, followers '
		+ 'WHERE (followers.follower_id = ' + req.query.user_id + ') AND (followers.owner_id = users.user_id) AND (feed.user_id = users.user_id) AND (feed.beer_id = beers.id) AND (feed.type = "RATE") GROUP BY users.user_name ORDER BY feed.created_date DESC;',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});

app.get('/follow', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	client.query(
		'INSERT INTO followers ' +
		'SET owner_id = ?, follower_id = ?, created_date = ?',
		[req.query.owner_id, req.session.user_id, current],
		function(err, sql_results, fields) {
			if (err) throw err;
			if (sql_results != undefined) {
				console.log(sql_results);
				res.send('{"status":"success"}');
			}
		});
});

app.get('/unfollow', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	client.query(
		'DELETE FROM followers WHERE (owner_id = ' + req.query.owner_id + ') AND (follower_id = ' + req.session.user_id + ')',
		function(err, sql_results, fields) {
			if (err) throw err;
			if (sql_results != undefined) {
				console.log(sql_results);
				res.send('{"status":"success"}');
			}
		});
});

app.get('/auth/twitter', function(req, res){
	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
		if (error) {
			console.log(error);
			res.send("yeah no. didn't work.");
		} else {
			req.session.oauth = {};
			req.session.oauth.token = oauth_token;
			console.log('oauth.token: ' + req.session.oauth.token);
			req.session.oauth.token_secret = oauth_token_secret;
			console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
			res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
		}
	});
});

app.get('/auth/twitter/callback', function(req, res, next) {
	if (req.session.oauth) {
		req.session.oauth.verifier = req.query.oauth_verifier;
		var oauth = req.session.oauth;
		var has_user = false;
		
		oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
		function(error, oauth_access_token, oauth_access_token_secret, results) {
			if (error) {
				console.log(error);
				res.send("yeah something broke.");
			} else {
				req.session.oauth.access_token = oauth_access_token;
				req.session.oauth.access_token_secret = oauth_access_token_secret;
				
				// Check database for user
				client.query(
					'SELECT user_name FROM ' + user_table + ' WHERE user_name = "' + results.screen_name + '";',
					function(err, sql_results, fields) {
						if (err) throw err;
						for(var i = 0; i < sql_results.length; i++) {
							if (results.screen_name == sql_results[i].user_name) {
								has_user = true;
								console.log(results.screen_name + '==' + sql_results[i].user_name);
							}
						}
						console.log('does user exist already? ' + has_user);
						
						// Get user creation datetime
						var time = new Date();
						var current = dateToString(time);
						
						// Checks if user is already in database
						if (has_user) {
							req.session.user_name = results.screen_name;
							req.session.user_id = results.user_id;
							console.log(current);
							res.redirect('/dashboard');
						} else {
							console.log(current);
							user_name = results.screen_name;
							req.session.user_name = user_name;
							req.session.user_id = results.user_id;
							$.ajax({
								cache: false,
								url: 'https://api.twitter.com/1/users/show.json',
								data: { screen_name: results.screen_name, user_id: results.user_id },
								dataType: 'jsonp',
								success: function(data) {
											req.session.avatar = data.profile_image_url;
											var full_name = data.name;
											var name = full_name.split(' ');
											client.query(
												'INSERT INTO ' + user_table + ' ' +
												'SET user_id = ?, user_name = ?, full_name = ?, first_name = ?, last_name = ?, avatar = ?, access_token = ?, access_token_secret = ?, created_date = ?',
												[results.user_id, results.screen_name, full_name, name[0], name[1], req.session.avatar, oauth_access_token, oauth_access_token_secret, current]
											);
											res.redirect('/dashboard');
										}
							});
						}
					});
			}
		});
	} else {
		next(new Error("you're not supposed to be here."));
	}
});

app.get('/logout', function(req, res) {
	delete req.session.user_name;
	delete req.session.user_id;
	res.json({'status':'success'});
});

console.log('Connected...');