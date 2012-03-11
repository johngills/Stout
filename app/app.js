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

app.use(express.compiler({ src: __dirname + '/views', enable: ['less'] }));
app.use('/css', express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.enable('jsonp callback');

// COMMON FUNCTIONS --------------------------------------

function checkAuth(req, res, next) {
	if (req.session.user_name == undefined) {
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
	"http://stoutapp.com/auth/twitter/callback",
	//"http://ps79519.dreamhostps.com:1337/auth/twitter/callback",
	"HMAC-SHA1"
);

function dateToString(date) {
	//check that date is a date object
	if (date && date.getFullYear()){ 
		return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();
	} 
	return "";
}

app.get('/', function(req, res) {	
	console.log(req.session.user_name);
	console.log(req.session.user_id);
	
	// then checks if there's anything in them
	if (req.session.user_name == undefined) {
		res.render('index', { layout: 'home', user_name: '', user_id: '', title: 'Stout' });
	} else {
		res.redirect('/dashboard');
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

app.get('/logout', function(req, res) {
	delete req.session.user_name;
	delete req.session.user_id;
	res.json({'status':'success'});
});

app.get('/dashboard', checkAuth, function(req, res) {	
	console.log(req.session.user_name);
	console.log(req.session.user_id);
	if (req.session.user_name != undefined || req.session.user_name != null) {
		res.render('dashboard', { user_name: req.session.user_name, user_id: req.session.user_id, title: 'Dashboard | Stout' });
	} else {
		delete req.session.user_name;
		delete req.session.user_id;
		res.redirect('/logout');
	}
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

// Feed Detail
app.get('/get-comments', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	console.log(req.query.id);
	
	// Checks comments table
	client.query(
		'SELECT DISTINCT feed.type, comments.owner_id, comments.partner_id, comments.rating, comments.beer_id AS beer_id, beers.name AS beer_name, beers.description, comments.comment, comments.created_date, comment_number.comment_count, ROUND(TIMESTAMPDIFF(SECOND,comments.created_date,"' + current + '")/60) AS time, owner.avatar AS owner_avatar, owner.first_name AS owner_first_name, owner.last_name AS owner_last_name, partner.avatar AS partner_avatar, partner.first_name AS partner_first_name, partner.last_name AS partner_last_name '
		+ 'FROM users AS owner, users AS partner, beers, feed, comments, '
		+ '(SELECT COUNT(comments.comment) AS comment_count FROM comments WHERE comments.feed_id = ' + req.query.id + ') AS comment_number '
		+ 'WHERE comments.feed_id = ' + req.query.id + ' AND feed.id = ' + req.query.id + ' AND comments.partner_id = partner.user_id AND comments.owner_id = owner.user_id AND comments.beer_id = beers.id ORDER BY comments.created_date',
		function(err, results, field) {
			if (err) throw err;
			console.log(results);
			if (results == '') {
				// Checks feed for latest comment if comments table is empty
				client.query(
					'SELECT feed.user_id, feed.beer_id AS beer_id, feed.rating, feed.type, feed.comment, feed.comment_count, beers.name AS beer_name, beers.description, users.first_name AS owner_first_name, users.last_name AS owner_last_name, users.avatar AS owner_avatar, ROUND(TIMESTAMPDIFF(SECOND,feed.created_date,"' + current + '")/60) AS time, feed.created_date '
					+ 'FROM feed, beers, users WHERE feed.id = ' + req.query.id + ' AND feed.beer_id = beers.id AND feed.user_id = users.user_id',
					function(err, results, field) {
						if (err) throw err;
						console.log(results);
						res.send(results);
				});
			} else {
				// If comment table is not empty, send the results!
				res.send(results);
			}
			// Update notification table - mark as read
			client.query(
				'UPDATE notifications SET notifications.read = 1 WHERE feed_id = ' + req.query.id + ' AND (type = "COMMENT" OR type = "RATE" OR type = "LIST");',
				function(err, results, field) {
					if (err) throw err;
					console.log(results);
			});
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
		'UPDATE beers SET beers.' + req.query.rate + ' = beers.' + req.query.rate + ' + 1' + unrate + ', last_mod = "' + current + '" WHERE id = ' + req.query.beer_id + ';',
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
					'SET user_id = ?, user_name = ?, beer_id = ?, type = ?, rating = ?, latitude = ?, longitude = ?, created_date = ? ',
					[req.session.user_id, req.session.user_name, req.query.beer_id, "RATE", rate, req.query.latitude, req.query.longitude, current],
					function(err, results, fields) {
						if (err) throw err;
						console.log(results);
						res.json({"status":"success", "feed_id": results.insertId, "beer_id": req.query.beer_id, "rate":rate });
						// Add notification
						if (req.query.partner_id != req.session.user_id) { // makes sure owner and current user aren't the same
							client.query(
								'INSERT INTO notifications ' +
								'SET owner_id = ?, partner_id = ?, type = ?, feed_id = ?, created_date = ?',
								[req.query.partner_id, req.session.user_id, "RATE", results.insertId, current],
								function(err, sql_results, fields) {
									if (err) throw err;
							});
						}
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
						// Delete notification
						client.query(
							'DELETE FROM notifications WHERE beer_id = ' + req.query.beer_id + ' AND partner_id = ' + req.session.user_id + ' AND type = "LIST";',
							function(err, sql_results, fields) {
								if (err) throw err;
						});
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
						// Add notification
						if (req.query.partner_id != req.session.user_id) { // makes sure owner and current user aren't the same
							client.query(
								'INSERT INTO notifications ' +
								'SET owner_id = ?, partner_id = ?, type = ?, feed_id = ?, beer_id = ?, created_date = ?',
								[req.query.partner_id, req.session.user_id, "LIST", results.insertId, req.query.beer_id, current],
								function(err, sql_results, fields) {
									if (err) throw err;
							});
						}
					}
				);
		});
	}
});



// --------------------------------------------------------------------------------------
// PROFILE
// --------------------------------------------------------------------------------------

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
			if (results == '') {
				// New user profile
				client.query(
					'SELECT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, beer_number.beer_count, follows.follower_count, following.following_count, todrink_number.todrink_count, followers.created_date '
					+ 'FROM users, '
					+ '(SELECT COUNT(todrink.user_id) AS todrink_count FROM todrink WHERE todrink.user_id = ' + req.query.user_id + ') AS todrink_number, '
					+ '(SELECT COUNT(feed.beer_id) AS beer_count FROM feed WHERE user_id = ' + req.query.user_id + ' AND feed.type = "RATE") AS beer_number, '
					+ '(SELECT COUNT(owner_id) AS follower_count FROM followers WHERE owner_id = ' + req.query.user_id + ') AS follows, '
					+ '(SELECT COUNT(follower_id) AS following_count FROM followers WHERE follower_id = ' + req.query.user_id + ') AS following '
					+ 'LEFT OUTER JOIN followers ON (follower_id = ' + req.session.user_id + ') AND (owner_id = ' + req.query.user_id + ') '
					+ 'WHERE users.user_id = ' + user_id,
					function(err, results, fields) {
						if (err) throw err;
						console.log(results);
						res.send(results);
				});
			} else {
				res.send(results);
			}
	});
	
	// Update notification table
	client.query(
		'UPDATE notifications SET notifications.read = 1 WHERE partner_id = ' + req.query.user_id + ' AND type = "FOLLOW";',
		function(err, results, field) {
			if (err) throw err;
			console.log(results);
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

app.get('/get-notifications', checkAuth, function(req, res) {
	client.query(
		'SELECT owner_id, partner_id, type, feed_id FROM notifications WHERE notifications.read = 0 AND notifications.owner_id = ' + req.session.user_id,
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
	});
});

app.get('/get-notifications-list', checkAuth, function(req, res) {
	var time = new Date();
	var current = dateToString(time);
	
	client.query(
		'SELECT notifications.owner_id, notifications.partner_id, notifications.type, notifications.read, notifications.feed_id, ROUND(TIMESTAMPDIFF(SECOND,notifications.created_date,"' + current + '")/60) AS time, notifications.created_date, users.first_name, users.last_name, users.avatar '
		+ 'FROM notifications, users '
		+ 'WHERE notifications.owner_id = ' + req.session.user_id + ' AND users.user_id = notifications.partner_id ORDER BY notifications.created_date DESC;',
		function(err, results, fields) {
			if (err) throw err;
			console.log(results);
			res.send(results);
			// Mark notifications read
			client.query(
				'UPDATE notifications SET notifications.read = 1 WHERE notifications.read = 0;',
				function(err, results, field) {
					if (err) throw err;
					console.log(results);
			});
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
			console.log(sql_results);
			if (req.query.owner_id != req.session.user_id) {
				// Add notification
				client.query(
					'INSERT INTO notifications ' +
					'SET owner_id = ?, partner_id = ?, type = ?, created_date = ?',
					[req.query.owner_id, req.session.user_id, "FOLLOW", current],
					function(err, sql_results, fields) {
						if (err) throw err;
				});
			}
			res.json({"status":"success"});
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
				res.json({"status":"success"});
			}
		});
});


// --------------------------------------------------------------------------------------
// OAUTH
// --------------------------------------------------------------------------------------



console.log('Connected...');