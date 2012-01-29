var express = require('express');
				
var static = require('node-static');
var jade = require('jade');
var OAuth = require('oauth').OAuth;
var url = require('url');
var fs = require('fs');
var http = require('http');
var $ = require('jquery');
// var base64 = require('base64');

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

// Twitter stuff
//
// var timestamp = Math.round((new Date()).getTime() / 1000);
// var consumer_secret = '19cnrCnCH8C7bn7xxvXl1N4jVWPtIvTZjJ8zbBthSS0';
// var oauth_token_secret = req.session.oauth.token_secret;
// var composite_signing = consumer_secret + '&' + oauth_token_secret;
// 
// function signature(req, res, next) {
// 	res.header()
// }
// var signature_base = encodeURIComponent();

var app = express.createServer( 
				express.static(__dirname + '/views'),
				express.cookieParser(),
				express.session({secret: 'FlurbleGurgleBurgle',
				                store: new express.session.MemoryStore({ reapInterval: -1 }) }));
app.listen(1337);
// var everyone = require("now").initialize(app);

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err.stack);
});

app.use(express.compiler({ src: __dirname + '/views', enable: ['less'] }));
app.use('/css', express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.enable('jsonp callback');

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
		// res.redirect('/dashboard');
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
		'SELECT DISTINCT feed.user_name, feed.user_id, users.first_name, users.last_name, users.avatar, feed.beer_id, feed.rating, ROUND(TIMESTAMPDIFF(SECOND,feed.created_date,"' + current + '")/60) AS time, beers.name AS beer_name '
		+ 'FROM feed, beers, users, followers '
		+ 'WHERE ((feed.user_id = users.user_id) AND (feed.beer_id = beers.id)) AND (((followers.owner_id = feed.user_id) AND (followers.follower_id = ' + req.session.user_id + ')) '
		+ 'OR ((feed.user_id = ' + req.session.user_id + '))) '
		+ 'ORDER BY feed.created_date DESC LIMIT ' + req.query.limit + ',10',
		function(err, sql_results, field) {
			if (err) throw err;
			if (sql_results != undefined) {
				console.log(sql_results);
				res.send(sql_results);
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
		'SELECT beers.name, beers.description, beers.abv, beers.love, beers.like, beers.meh, beers.dislike, breweries.name AS brewery, categories.cat_name, styles.style_name, feed.rating FROM beers, breweries, categories, styles LEFT OUTER JOIN feed ON (feed.user_id = ' + req.session.user_id + ' AND feed.beer_id = ' + req.query.beer_id + ') WHERE (beers.id = ' + req.query.beer_id + ') AND (beers.brewery_id = breweries.id) AND (beers.cat_id = categories.id) AND (beers.style_id = styles.id)',
		function(err, sql_results, field) {
			if (err) throw err;
			if (sql_results != undefined) {
				console.log(sql_results);
				res.send(sql_results);
			}
		});
});

// everyone.now.getBreweries = function(){
//     client.query(
// 		'SELECT name, id AS value FROM breweries',
// 		function(err, results, fields) {
// 			if (err) throw err;
// 			console.log(results);
// 			everyone.now.showBreweries(results);
// 	});
// }
app.get('/get-breweries', checkAuth, function(req, res) {
	client.query(
		'SELECT name, id AS value FROM breweries',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});
// everyone.now.getBeerCategories = function(){
//     client.query(
// 		'SELECT * FROM categories',
// 		function(err, results, fields) {
// 			if (err) throw err;
// 			console.log(results);
// 			everyone.now.showBeerCategories(results);
// 	});
// }
app.get('/get-beer-categories', checkAuth, function(req, res) {
	client.query(
		'SELECT * FROM categories',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});
// everyone.now.getBeerStyles = function(id){
//     client.query(
// 		'SELECT * FROM styles WHERE cat_id = ' + id,
// 		function(err, results, fields) {
// 			if (err) throw err;
// 			console.log(results);
// 			everyone.now.showBeerStyles(results);
// 	});
// }
app.get('/get-beer-styles', checkAuth, function(req, res) {
	client.query(
		'SELECT * FROM styles WHERE cat_id = ' + req.query.cat_id,
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});
// everyone.now.insertNewBeer = function(name, brewery, description, abv, category, style) {
// 	client.query(
// 		'INSERT INTO beers ' +
// 		'SET name = ?, brewery_id = ?, description = ?, cat_id = ?, style_id = ?, abv = ?, last_mod = ?',
// 		[name, brewery, description, category, style, abv, current],
// 		function(err, results, fields) {
// 			if (err) throw err;
// 			console.log(results);
// 			client.query(
// 				'SELECT id, name FROM beers WHERE name = "' + name + '";',
// 				function(err, results, fields) {
// 					if (err) throw err;
// 					console.log(results);
// 					everyone.now.showNewBeer(results);
// 			});
// 	});
// }
app.get('/add-new-brewery', checkAuth, function(req, res) {
	client.query(
		'INSERT INTO breweries SET name = ?',
		[req.query.name],
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			client.query(
				'SELECT id, name FROM breweries WHERE name = "' + req.query.name + '";',
				function(err, results, fields) {
					if (err) throw err;
					console.log(results);
					res.send(results);
			});
	});
});
app.get('/new-beer', checkAuth, function(req, res) {
	client.query(
		'INSERT INTO beers ' +
		'SET name = ?, brewery_id = ?, description = ?, cat_id = ?, style_id = ?, abv = ?, last_mod = ?',
		[req.query.name, req.query.brewery, req.query.description, req.query.category, req.query.style, req.query.abv, current],
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			client.query(
				'SELECT id, name FROM beers WHERE name = "' + req.query.name + '";',
				function(err, results, fields) {
					if (err) throw err;
					console.log(results);
					res.send(results);
			});
	});
});

app.get('/beer-checkin', checkAuth, function(req, res) {
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
				var time = new Date();
				var current = dateToString(time);
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
					'SET user_id = ?, user_name = ?, beer_id = ?, rating = ?, created_date = ?',
					[req.session.user_id, req.session.user_name, req.query.beer_id, rate, current],
					function(err, sql_results, fields) {
						if (err) throw err;
						if (sql_results != undefined) {
							console.log(sql_results);
							res.send('{"status":"success"}');
						}
					}
				);
			} else {
				res.send('{"status":"failure"}');
			}
		});
});

app.get('/find-friend', checkAuth, function(req, res) {
	console.log('search term: ' + req.query.user_name);
	client.query(
		'SELECT DISTINCT users.user_name, users.first_name, users.last_name, users.user_id, users.avatar FROM users WHERE users.user_name LIKE "%' + req.query.user_name + '%" OR users.first_name LIKE "%' + req.query.user_name + '%" OR users.last_name LIKE "%' + req.query.user_name + '%" ORDER BY users.created_date DESC LIMIT 0,10;',
		function(err, sql_results, fields) {
			if (err) throw err;
			if (sql_results != undefined) {
				console.log(sql_results);
				res.send(sql_results);
			}
		});
});

app.get('/get-profile', checkAuth, function(req, res) {
	var user_id = req.session.user_id;
	if (req.query.user_id != '') {
		user_id = req.query.user_id;
	}
	console.log('profile for user id: ' + user_id);
	client.query(
		'SELECT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name, followers.created_date FROM users, feed, beers LEFT OUTER JOIN followers ON (follower_id = ' + req.session.user_id + ') AND (owner_id = ' + req.query.user_id + ') WHERE (users.user_id = ' + user_id + ') AND (feed.user_id = ' + user_id + ') AND (feed.beer_id = beers.id) ORDER BY feed.created_date DESC LIMIT 0,5;',
		function(err, sql_results, fields) {
			if (err) throw err;
			if (sql_results != undefined && sql_results != '') {
				console.log(sql_results);
				res.send(sql_results);
			} else {
				client.query(
					'SELECT users.user_name, users.avatar, users.user_id FROM users WHERE users.user_id = ' + req.query.user_id,
					function(err, sql_results, fields) {
						if (err) throw err;
						if (sql_results != undefined && sql_results != '') {
							console.log(sql_results);
							res.send(sql_results);
						}
					});
			}
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

// app.get('/check-connection', checkAuth, function(req, res) {
// 	var owner_id = '';
// 	if (req.query.owner_id != '') {
// 		owner_id = ' AND (owner_id = ' + req.query.user_id + ')';
// 	}
// 	client.query(
// 		'SELECT created_date CASE WHEN (follower_id = ' + req.session.user_id + ')' + owner_id + ' THEN 1 ELSE 0 END AS following FROM followers',
// 		function(err, sql_results, fields) {
// 			if (err) throw err;
// 			if (sql_results != undefined) {
// 				console.log('follow? ' + sql_results);
// 				res.send(sql_results);
// 			}
// 		}
// 	);
// });

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
		
		// var time = new Date();
		// var current = dateToString(time);
		
		// console.log('decode: ' + base64.encode(current)); // creates nonce;
		
		oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
		function(error, oauth_access_token, oauth_access_token_secret, results) {
			if (error) {
				console.log(error);
				res.send("yeah something broke.");
			} else {
				req.session.oauth.access_token = oauth_access_token;
				req.session.oauth.access_token_secret = oauth_access_token_secret;
				
				// sets cookies upon initial login
				// res.cookie('user_name', results.screen_name, { expires: new Date(Date.now() + 900000), httpOnly: true });
				// res.cookie('user_id', results.user_id, { expires: new Date(Date.now() + 900000), httpOnly: true });
				// localStorage['user_name'] = results.screen_name;
				// localStorage['user_id'] = results.user_id;
				
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
											var avatar = data.profile_image_url;
											var full_name = data.name;
											var name = full_name.split(' ');
											client.query(
												'INSERT INTO ' + user_table + ' ' +
												'SET user_id = ?, user_name = ?, first_name = ?, last_name = ?, avatar = ?, access_token = ?, access_token_secret = ?, created_date = ?',
												[results.user_id, results.screen_name, name[0], name[1], avatar, oauth_access_token, oauth_access_token_secret, current]
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