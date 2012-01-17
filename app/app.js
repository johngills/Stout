var express = require('./node_modules/express');
				
var static = require('node-static');
var jade = require('jade');
var OAuth = require('oauth').OAuth;
var url = require('url');
var fs = require('fs');
var http = require('http');
// var base64 = require('base64');

// CSS ---------------------------------------------------
var less = require('less');
var parser = new(less.Parser)({
    paths: ['.', './views/css'], // Specify search paths for @import directives
    filename: 'style.less' // Specify a filename, for better error messages
});

parser.parse('.class { width: 1 + 1 }', function (e, tree) {
    tree.toCSS({ compress: true }); // Minify CSS output
});

// DATABASE INFO -----------------------------------------
var mysql = require('mysql'),
	database = 'stout',
	user_table = 'users',
	client = mysql.createClient({ user: 'sterlingrules', password: '@y&7~s45', host: 'mysql.mynameissterling.com', port: 3306 });
	client.query('USE ' + database);

// var mysql = require('mysql'),
// 	database = 'beer',
// 	user_table = 'users',
// 	client = mysql.createClient({ user: 'root', password: '' });
// 	client.query('USE ' + database);

// OAUTH SETUP --------------------------------------------
var oa = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	"6nvxG75CDfoNWTiZ8jRQ",
	"19cnrCnCH8C7bn7xxvXl1N4jVWPtIvTZjJ8zbBthSS0",
	"1.0",
	"http://localhost:1337/auth/twitter/callback",
	"HMAC-SHA1"
);
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

function dateToString(date){ 
	//check that date is a date object 
	if (date && date.getFullYear()){ 
		return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();
	} 
	return ""; 
}

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err.stack);
});

app.use(express.cookieParser());
app.use(express.compiler({ src: __dirname + '/views', enable: ['less'] }));
app.use('/css', express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

function checkAuth(req, res, next) {
	if (!req.session.user_name) {
		res.redirect('/');
	} else {
		next();
	}
}

app.get('/', function(req, res) {
	res.render('index', { user_name: '', user_id: '', title: 'Stout' });
});

app.get('/dashboard', checkAuth, function(req, res) {
	console.log(req.session.user_name);
	res.render('dashboard', { user_name: req.session.user_name, user_id: req.session.user_id, title: 'Stout' });
});

app.get('/get-feed', checkAuth, function(req, res) {
	client.query(
		'SELECT DISTINCT feed.user_name, feed.user_id, users.avatar, feed.beer_id, feed.rating, feed.created_date, beers.name AS beer_name '
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
				res.send('{"status":"success"}');
				var rate = '';
				var time = new Date();
				var now = dateToString(time);
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
					[req.session.user_id, req.session.user_name, req.query.beer_id, rate, now],
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
		'SELECT users.user_name, users.user_id, users.avatar, beers.name AS beer_name, beers.id FROM users, beers, feed WHERE (beers.id = feed.beer_id) AND (users.user_id = feed.user_id) AND users.user_name LIKE "%' + req.query.user_name + '%" ORDER BY users.created_date DESC LIMIT 0,10;',
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
		'SELECT users.user_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name, followers.created_date FROM users, feed, beers LEFT OUTER JOIN followers ON (follower_id = ' + req.session.user_id + ') AND (owner_id = ' + req.query.user_id + ') WHERE (users.user_id = ' + user_id + ') AND (feed.user_id = ' + user_id + ') AND (feed.beer_id = beers.id) ORDER BY feed.created_date DESC LIMIT 0,5;',
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
	var now = dateToString(time);
	client.query(
		'INSERT INTO followers ' +
		'SET owner_id = ?, follower_id = ?, created_date = ?',
		[req.query.owner_id, req.session.user_id, now],
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
	var now = dateToString(time);
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
		
		var time = new Date();
		var now = dateToString(time);
		
		// console.log('decode: ' + base64.encode(now)); // creates nonce;
		
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
						var now = dateToString(time);
						var avatar = '';
						// Checks if user is already in database
						if (has_user) {
							req.session.user_name = results.screen_name;
							req.session.user_id = results.user_id;
							console.log(now);
							res.redirect('/dashboard');
						} else {
							console.log(now);
							user_name = results.screen_name;
							req.session.user_name = user_name;
							req.session.user_id = results.user_id;
							http.get({
								host: 'api.twitter.com',
								port: 80,
								path: '/1/users/profile_image/' + results.screen_name + '.json' },
								function(res) {
									avatar = res.header('Location');
									console.log(res.header('Location'));
									client.query(
										'INSERT INTO ' + user_table + ' ' +
										'SET user_id = ?, user_name = ?, avatar = ?, access_token = ?, access_token_secret = ?, created_date = ?',
										[results.user_id, results.screen_name, avatar, oauth_access_token, oauth_access_token_secret, now]
									);
								}
							);
							res.redirect('/dashboard');
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
	res.redirect('/');
});

app.listen(1337);
console.log('Connected...');