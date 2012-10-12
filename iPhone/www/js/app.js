// CONSTANTS
//var url = 'http://localhost:8989',
//var url = 'http://stoutapp.com:8989',
//var user_id = 0,
//	username = '';

// DATABASE FUNCTIONS ------------------------------------------------------ */

// error callback
function errorCB(tx, err) {
    console.log("Error processing SQL: " + err.code);
}

// success callback
function successCB() {
    console.log("Success!");
}

function dateToString(date) {
	//check that date is a date object
	if (date && date.getFullYear()){ 
		return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();
	} 
	return "";
}

function closeSlide() {
	//$('#slide-up span.results').empty();
	$('#slide-up').removeClass('active').hide();
}



// function handleOpenURL(address) {
//     console.log(address);
// 	var results = address.split('?');
// 	
// 	localStorage['username'] = results[1];
// 	localStorage['user_id'] = results[2];
// 		
// 	console.log(localStorage['username']);
// 	console.log(localStorage['user_id']);
// 	
// 	window.location='dashboard.html#_index';
// }

function onBodyLoad() {	
	document.addEventListener("deviceready", onDeviceReady, false);
}
function onDeviceReady() {
    console.log("onDeviceReady");
	pictureSource=navigator.camera.PictureSourceType;
	destinationType=navigator.camera.DestinationType;
	
	// Create/Access Database on Start
	db.transaction(function(tx) {
		
		// resets database
		// tx.executeSql('DROP TABLE IF EXISTS user');
		
		// setup database
		tx.executeSql('CREATE TABLE IF NOT EXISTS user (id INT(20), user_id INT(20), username varchar(255), created_date DATETIME);');
		
		// input data
		tx.executeSql('SELECT * FROM user', [],
			function(tx, results) {
				
				var time = new Date();
				var current = dateToString(time);
				
				console.log("Returned rows = " + results.rows.length);
				
				// A user is already logged in
				if (results.rows.length != 0) {
					tx.executeSql('SELECT user_id, username FROM user', [],
						function(tx, results) {							
							user_id = results.rows.item(0).user_id;
							username = results.rows.item(0).username;
							console.log(username);
							console.log(user_id);
							
							// Load Feed
							loadTab(0);
							
						}, errorCB);
				}
			}, errorCB);
			
	}, errorCB, successCB);
}



// --------------------------------------------------------------------------------------
// SETUP
// --------------------------------------------------------------------------------------

var limit = 0,
	scroll = 0,
	isProcessing = false,
	myScroll;
var date = new Date();
var time = encodeURIComponent(date);
var timeout = 20000;

function load(message,status) {
	$('#load_overlay').remove();
	if (message != undefined) {
		$('body').append('<section id="load_overlay" style="display:block;"><section class="dialogue"><span style="bottom-top:-10px;">' + circular_loader + '</span>' + message + '</section></section>');
	}
	if (status != undefined) {
		setTimeout("$('#load_overlay').remove();",1000);
	} else if (status == 'error') {
		$('#circular3dG').remove();
	}
}

function store() {
	var user_id = $('input#user_id').val();
	var user_name = $('input#user_name').val();
	console.log(user_name);
	console.log(user_id);
	if (user_name != undefined && user_id != undefined) {
		localStorage['user_id'] = user_id;
		localStorage['user_name'] = user_name;
		$.ajax({
			cache: false,
			url: url + '/logged',
			data: { user_name: user_name, user_id: user_id },
			success: function(results) {
						if (results.status == 'success') {
							loadTab(0);
							setTimeout('getNotifications()',1000);
							setInterval('getNotifications()',10000);
						} else {
							load();
						}
					},
			error: function(results) {
						console.log(results);
						return false;
					}
		});
	} else {
		logout();
	}
}

function storeCheck() {
	if (localStorage['revision12'] == null) {
		localStorage.clear();
		localStorage['revision12'] = time;
	}
	if (localStorage['user_id'] != null) {
		load('Opening the tab...');
		var user_name = localStorage['user_name'];
		var user_id = localStorage['user_id'];
		$.ajax({
			cache: false,
			url: url + '/logged',
			data: { user_name: user_name, user_id: user_id },
			success: function(results) {
						if (results.status == 'success') {
							window.location='dashboard.html#_index';
						} else {
							load();
						}
					},
			error: function(results) {
						console.log(results);
						return false;
					}
		});
	}
}

function logout() {
	load('Closing your tab');
	$.ajax({
		cache: false,
		url: url + '/logout',
		success: function(results) {
					if (results.status == 'success') {
						// Create/Access Database on Start
						db.transaction(function(tx) {

							// resets database
							tx.executeSql('DROP TABLE IF EXISTS user');

						}, errorCB, successCB);
						
						window.location='index.html';
						load();
					}
				},
		error: function(results) {
					return false;
				}
	});
}

// just a test
function message(message) {
	$('body').append('<section id="overlay" ontouchstart="$(\'#modal\').fadeOut();" style="width:100%; text-align:center; position:absolute; top:0; left:0; display:block; padding-top:75px; background:rgba(0,0,0,0.5);"><section style="background:#ffffff; color:#000000; display:block; width:150px; height:75px; margin:0 auto;">just testing</section><section style="clear:both;"></section></section>');
}

function tabSelect(name) {
	$('#footer ul li').removeClass('active');
	// $('#index').removeClass('active');
	if (name != '') {
		$('#footer ul li.' + name).addClass('active');
	}
}

function fixTime(time) {
	if (time == 0) {
		time = '<time class="right">just now</time>'; // seconds ago
	} else if (time > 0 && time < 60) {
		time = '<time class="right">' + time + 'm</time>'; // minutes ago
	} else if (time > 59 && time < 1440) {
		time = '<time class="right">' + Math.round(time/60) + 'h</time>'; // hours ago
	} else if (time > 1439 && time < 10080) {
		time = '<time class="right">' + Math.round(time/1440) + 'd</time>'; // days ago
	} else if (time > 10079 && time < 473760) {
		time = '<time class="right">' + Math.round(time/10080) + 'w</time>'; // weeks ago
	} else if (time > 473759) {
		time = '<time class="right">' + Math.round(time/473760) + 'y</time>'; // weeks ago
	}
	return time;
}

function loadTab(limit,comment) {
	
	if (isProcessing) { return false; }
	
	var sort = $('#index li.tab_heading ul li.active').attr('id'),
		top = limit;
	
	console.log('loadTab: ' + sort);
	console.log('loadTab: ' + username);
	console.log('loadTab: ' + user_id);
	
	window.location='dashboard.html#_index';
	
	// resets
	if (comment == '') {
		$('#add_comment').removeClass('active');
		$('#footer').addClass('active');
	}
	
	if (limit == 0) {
		$('html, body').animate({scrollTop: '0px'}, 0);
		$('#index span.results').empty().prepend(circular_loader);
	} else {
		$('#index span.results').append(circular_loader);
	}
	$('.load_more').remove();
	tabSelect('the_tab');
	
	$.ajax({
		cache: false,
		timeout: timeout,
		url: url + '/get-feed',
		data: { limit: limit, sort: sort, user_id: user_id },
		success: function(results) {
		
					isProcessing = true;
					
					if (results != '') {
						if (limit == 0) {
							$('#index span.results').empty();
						} else {
							$('#circular3dG').remove();
						}
						// $('li.load_more').remove();
						for (var i = 0; i < results.length; i++) {
							
							// RATING ------------------------
							var action = '',
								tag = '',
								list_copy = '',
								todo = '';
							if (results[i].rating != '') {
								switch(results[i].rating) {
									case 1:
										action = 'loves';
										tag = '<span class="right love tag"></span>';
										break;
									case 2:
										action = 'likes';
										tag = '<span class="right like tag"></span>';
										break;
									case 3:
										action = 'is meh for';
										tag = '<span class="right meh tag"></span>';
										break;
									case 4:
										action = 'dislikes';
										tag = '<span class="right dislike tag"></span>';
										break;
								}
							}
							if (results[i].type == 'LIST') {
								action = 'added';
								tag = '<span class="right todo tag"></span>';
								todo = ' todo';
								list_copy = '<p class="meta" style="margin: -5px 0 5px 43px;">to their To Drink list</p>';
							}
							
							var time = (results[i].time == undefined) ? '' : fixTime(results[i].time);
							
							// COMMENT ------------------------
							var comment = '';
							if (results[i].comment != null) {
								comment = '<blockquote>' + decodeURIComponent(results[i].comment) + '</blockquote>';
							}
							
							var comment_count = '', rating_count = '';
							if (results[i].comment_count != 0) {
								if (results[i].comment_count > 1) {
									comment_count = '<span class="comment_count right"><span class="icon comment right"></span>' + results[i].comment_count + '</span>';
								} else {
									comment_count = '<span class="comment_count right"><span class="icon comment right"></span>' + results[i].comment_count + '</span>';
								}
							}
							if (results[i].rating_count > 1) {
								rating_count = '<span class="rating_count right">' + results[i].rating_count + 'x</span>';
							}
							
							var avatar = '<img src="' + results[i].avatar + '" width="32px" class="left avatar" ontouchstart="loadProfile(' + results[i].user_id + ');" />'
							var item_heading = '<p class="meta"><span class="name" id="' + results[i].user_id + '">' + results[i].first_name + '</span> ' + action + '</p>';
							var beer_name = '<h3 id="' + results[i].beer_id + '" class="beer_name">' + results[i].beer_name + '</h3>';
							
							$('#index span.results').append('<li id="feed-item-' + results[i].id + '" class="feed-item' + todo + '">'
												+ avatar
												+ '<a href="javascript:void(0);" onclick="feedDetail(' + results[i].id + ');">'
												// + '<section class="icon arrow right"></section>'
												+ tag
												+ '<span class="info">'
												+ time
												+ rating_count
												+ comment_count
												+ '</span>'
												+ item_heading
												+ beer_name
												+ list_copy
												+ comment
												// + '<span class="footer">'
												// + time
												// + rating_count
												// + comment_count
												// + '<section class="push"></section></span>'
												+ '</a></li>');
						}
						
						var obj = $('#index span.results li');
						var feed = $.makeArray(obj);
						
						if (feed.length > 5 && results.length >= 10) {
							limit += 10;
							// $('#index span.results').append(circular_loader);
						} else {
							$('#index span.results').append('<li class="load_more">end of the line</li>');
						}
					} else {
						$('#index span.results').empty().append('<li class="load_more">Your tab is empty, start by adding a beer and following others!</li>');
					}
					console.log('new limit: ' + limit);
					if (top == 0) {
						setTimeout("$('html, body').animate({scrollTop: '53px'}, 500)",1000);
					}
					
					// $(window).scroll(infiniteScroll());
					isProcessing = false;
					scroll = 0; // Set back the scroll value for infinite scroll
				},
		error: function(results) {
					load('Something went wrong!','error');
					// $(window).scroll(infiniteScroll());
					isProcessing = false;
					$('#circular3dG').remove();
					$('#index span.results').append('<li class="load_more" ontouchstart="loadTab(' + limit + ');">Tap to Try Again</li>');
					return false;
				}
	});
}

function feedDetail(id,notification) {
	// load('Brewing...');
	
	if (notification == true) {	$('#notifier').removeClass('active'); }
	if (isProcessing) { return false; } // Checks if in the middle of an ajax call
	
	var beer_id = $('#feed-item-' + id).find('h3.beer_name').attr('id'),
		partner_id = $('#feed-item-' + id).find('span.name').attr('id'),
		feed_item = $('#feed-item-' + id).html(),
		feed_classes = $('#feed-item-' + id).attr('class');
	
	console.log('beer_id: ' + beer_id + ', partner_id: ' + partner_id);
	
	$('ul#feed_detail span.results').empty().append('<li id="feed-item-' + id + '" class="' + feed_classes + '">' + feed_item + '</li>' + circular_loader);
	
	// to top
	$('html, body').animate({scrollTop: '0px'}, 0);
	
	//removes footer - empties comment
	$('#add_comment_text').val('');
	$('#footer').removeClass('active');
	$('#add_comment').addClass('active');
	
	window.location='dashboard.html#_feed_detail';
	
	$.ajax({
		cache: false,
		timeout: timeout,
		url: url + '/get-comments',
		data: { id: id, notification: notification },
		success: function(results) {
					if (results != '') {
						$('#circular3dG').remove();
						
/*
						var title = results[0].name;
						var first_name = (results[0].owner_first_name == null) ? '' : results[0].owner_first_name;
						var last_name = (results[0].owner_last_name == null) ? '' : results[0].owner_last_name;
						var user_name = first_name + ' ' + last_name;
						var action = '', list_copy = '';
						var time = (results[0].time == undefined) ? '' : fixTime(results[0].time);
						var comment = '';
						var comment_count = '', rating_count = '';
						var beer_name = '<h3 id="' + results[0].beer_id + '" class="beer_name">' + results[0].beer_name + '</h3>';
						var owner_id = (results[0].owner_id == null) ? results[0].user_id : results[0].owner_id;
						var avatar = '<img src="' + results[0].owner_avatar + '" width="32px" class="left avatar" ontouchstart="loadProfile(' + owner_id + ');" />';
						
						// RATING ------------------------
						if (results[0].rating != '') {
							switch(results[0].rating) {
								case 1:
									action = 'loves';
									break;
								case 2:
									action = 'likes';
									break;
								case 3:
									action = 'is meh for';
									break;
								case 4:
									action = 'dislikes';
									break;
							}
						}
						if (results[0].type == 'LIST') {
							action = 'added';
							list_copy = '<p class="meta" style="margin: -5px 0 5px 43px;">to their To Drink list</p>';
						}
						
						// COMMENT ------------------------
						if (results[0].comment != null) {
							comment = '<blockquote>' + decodeURIComponent(results[0].comment) + '</blockquote>';
						}
						
						if (results[0].comment_count != 0) {
							comment_count = '<span class="comment_count right"><span class="icon comment right"></span>' + results[0].comment_count + '</span>';
						}
						
						if (results[0].rating_count > 1) {
							rating_count = '<span class="rating_count right">' + results[0].rating_count + '</span>';
						}
						
						$('#add_comment_text').attr('onblur','addComment(' + results[0].beer_id + ',' + results[0].rating + ',' + id + ',' + owner_id + ');');
						
						var item_heading = '<p class="meta">' + results[0].owner_first_name + ' ' + action + '</p>';
						
						// sets up feed owner info
						$('ul#feed_detail').attr('title',title);
						$('ul#feed_detail span.results').empty().append('<li>'
											+ avatar
											+ '<a href="javascript:void(0);" ontouchstart="beerDetail(' + results[0].beer_id + ',' + owner_id + ',' + id + ');">'
											+ '<section class="icon arrow right"></section>'
											+ '<span class="info">'
											+ time
											+ rating_count
											+ comment_count
											+ '</span>'
											+ item_heading
											+ beer_name
											+ list_copy
											+ comment
											+ '<section class="push"></section>'
											+ '</a></li>');
						
*/
/*
						if (results[0].owner_id == results[0].partner_id) {
							if (results[0].comment != undefined) {
								var i = 1;
							}
						} else {
							var i = 0;
						}
*/
						
						var owner_id = (results[0].owner_id == null) ? results[0].user_id : results[0].owner_id;
						
						// Setup Feed Detail
						$('ul#feed_detail .feed-item a').attr('onclick','beerDetail(' + beer_id + ',' + partner_id + ',' + id + ');');
						$('#add_comment_text').attr('onblur','addComment(' + results[0].beer_id + ',' + results[0].rating + ',' + id + ',' + owner_id + ');');
						
						console.log($('ul#feed_detail').html());
						
						// adds additional comments
						console.log(results);
						
						for(var i = 0; i < results.length; i++) {
						
							var first_name = (results[i].partner_first_name == null) ? '' : results[i].partner_first_name;
							var last_name = (results[i].partner_last_name == null) ? '' : results[i].partner_last_name;
							var user_name = first_name;
							var time = (results[i].time == undefined) ? '' : fixTime(results[i].time);
							
							if (results[i].comment != undefined) {
							
								$('ul#feed_detail span.results').append('<li>'
													+ '<a href="javascript:void(0);">'
													+ '<img src="' + results[i].partner_avatar + '" ontouchstart="loadProfile(\'' + results[i].partner_id + '\')" width="32px" class="avatar left" />'
													+ time
													+ '<p class="meta">' + user_name + '</p>'
													+ '<p class="comment">' + decodeURIComponent(results[i].comment) + '</p>'
													+ '</a></li>');
							}
						}
						
						// load();
						
					} else if (results[0].status == 'success') {
						$('#circular3dG').remove();
						return false; // There are just no comments
					} else {
						load('Something went wrong!','error');
					}
					isProcessing = false;
				},
		error: function(results) {
					load('Something went wrong!','error');
					isProcessing = false;
					return false;
				}
	});
}

function loadFindBeer() {	
	tabSelect('find_beer');
	$('input#beer_name').focus();
	$('#beer_name').val('');
	$('html, body').animate({scrollTop: '0px'}, 0);
	$('#find_beer span.results').empty();
	window.location='dashboard.html#_find_beer';
}

function loadTwitterFriends() {

	$('ul#find_friend span.results').empty().append(circular_loader);
	if (isProcessing) { return false; } // Checks if in the middle of an ajax call
	
	$.ajax({
		cache: false,
		timeout: 20000,
		url: url + '/get-twitter-friends',
		data: { user_id: user_id, user_name: username },
		success: function(results) {
					if (results != '') {
						$('ul#find_friend span.results').empty();
						var stout_ids = [];
						
						console.log(results.stout_friends);
						
						// Stout Friends
						if (results.stout_friends != undefined) {
							for(var i = 0; i < results.stout_friends.length; i++) {
								var first_name = (results.stout_friends[i].first_name == null) ? '' : results.stout_friends[i].first_name;
								var last_name = (results.stout_friends[i].last_name == null) ? '' : results.stout_friends[i].last_name;
								var user_id = results.stout_friends[i].user_id;
								var beer_name = '<h3>' + results.stout_friends[i].beer_name + '</h3>';
								var avatar = results.stout_friends[i].avatar;
							
								stout_ids[i] = user_id;
							
								$('ul#find_friend span.results').append('<li style="height:55px;">'
																	+ '<a href="javascript:void(0);" onclick="follow(' + user_id + ')" class="btn orange ' + user_id + '" style="max-height:20px; float:right;">Follow</a>'
																	+ '<a href="#profile" id="' + user_id + '" onclick="javascript:loadProfile(' + user_id + ');">'
								 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
																	+ '<h3 class="left">' + first_name + ' ' + last_name + '</h3>'
								 									+ '</a></li>');
							}
						}

						// Twitter Friends
						if (results.twitter_friends != undefined) {
							for(var i = 0; i < results.twitter_friends.length; i++) {
								var name = (results.twitter_friends[i].name == null) ? '' : '<h3 class="beer_name">' + results.twitter_friends[i].name + '</h3>';
								var screen_name = (results.twitter_friends[i].screen_name == null) ? '' : '<p class="meta" style="margin-top:2px;">' + results.twitter_friends[i].screen_name + '</p>';
								var twitter_id = results.twitter_friends[i].id;
								var avatar = results.twitter_friends[i].profile_image_url;
							
								if ($.inArray(twitter_id,stout_ids) == -1) {
									$('ul#find_friend span.results').append('<li style="height:55px;">'
																		+ '<a href="javascript:void(0);" onclick="inviteTwitter(\'' + results.twitter_friends[i].screen_name + '\',' + twitter_id + ');" class="btn blue ' + twitter_id + '" style="max-height:20px; float:right;">Invite</a>'
									 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
																		+ screen_name
																		+ name
																		+ '</li>');
								}
							}
						}
					} else {
						load('Something went wrong!','error');
						return false;
					}
					load();
					isProcessing = false;
				},
		error: function(results) {
					load('Something went wrong!','error');
					isProcessing = false;
					return false;
				}
	});
}

function inviteTwitter(screen_name,id) {
	load('Inviting...');
	var style = $('a.' + id).attr('style');
	if (isProcessing) { return false; } // Checks if in the middle of an ajax call
	
	$.ajax({
		cache: false,
		url: url + '/send-twitter-invite',
		timeout: 5000,
		data: { screen_name: screen_name, user_id: user_id },
		success: function(results) {
					if (results.status == 'success') {
						$('a.' + id).replaceWith('<a href="javascript:void(0);" class="btn light ' + id + '" style="' + style + '">Invited</a>');
					} else {
						load('Something went wrong!','error');
						return false;
					}
					load();
					isProcessing = false;
				},
		error: function(results) {
					load('Something went wrong!','error');
					isProcessing = false;
					return false;
				}
	});
}

function loadFindFriend() {
	
	loadTwitterFriends();
	
	// resets footer
	$('#add_comment').removeClass('active');
	$('#footer').addClass('active');
	
	tabSelect();
	$('#user_name').val('');
	$('html, body').animate({scrollTop: '0px'}, 0);
	
	window.location='dashboard.html#_find_friend';
}



// --------------------------------------------------------------------------------------
// BEERS
// --------------------------------------------------------------------------------------

function beerDetail(id,partner_id,feed_id) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	load('Brewing...');
	
	// reset footer
	$('#add_comment').removeClass('active');
	$('#footer').addClass('active');
	
	if (isProcessing) { return false; } // Checks if in the middle of an ajax call
	
	$.ajax({
		cache: false,
		url: url + '/beer-detail',
		data: { beer_id: id, user_id: user_id },
		success: function(results) {
					if (results != '') {
						var beer_name = escape(results[0].name);
						var brewery = (results[0].cat_name != '') ? '<p class="stats"><b>Brewery:</b>' + results[0].brewery + '</p>' : '';
						var abv = (results[0].abv > 0) ? '<p class="stats"><b>ABV:</b>' + results[0].abv + '%</p>' : '';
						var category = (results[0].cat_name != '') ? '<p class="stats"><b>Category:</b>' + results[0].cat_name + '</p>' : '';
						var style = (results[0].style_name != '') ? '<p class="stats"><b>Style:</b>' + results[0].style_name + '</p>' : '';
						var description = (results[0].description != '') ? '<p style="padding:10px; font-weight:normal;">' + results[0].description + '</p>' : '';
						
						var love = (results[0].love > 0) ? results[0].love : '';
						var like = (results[0].like > 0) ? results[0].like : '';
						var meh = (results[0].meh > 0) ? results[0].meh : '';
						var dislike = (results[0].dislike > 0) ? results[0].dislike : '';
						
						var love_active = '', like_active = '', meh_active = '', dislike_active = '', ed = '', todrink_active = '', rate_again = '';
						switch(results[0].rating) {
							case 1:
								love_active = ' active';
								rate_again = '<li class="info-list"><section class="info-inset">I\'ll have the usual.<a href="javascript:void(0);" ontouchstart="rateBeer(' + id + ',\'love\',' + partner_id + ',' + true + ');" class="btn orange right" style="margin:-10px 0 0 0;">Drink Again?</a></section></li>';
								break;
							case 2:
								like_active = ' active';
								rate_again = '<li class="info-list"><section class="info-inset">I\'ll have the usual.<a href="javascript:void(0);" ontouchstart="rateBeer(' + id + ',\'like\',' + partner_id + ',' + true + ');" class="btn orange right" style="margin:-10px 0 0 0;">Drink Again?</a></section></li>';
								break;
							case 3:
								meh_active = ' active';
								rate_again = '<li class="info-list"><section class="info-inset">I\'ll have the usual.<a href="javascript:void(0);" ontouchstart="rateBeer(' + id + ',\'meh\',' + partner_id + ',' + true + ');" class="btn orange right" style="margin:-10px 0 0 0;">Drink Again?</a></section></li>';
								break;
							case 4:
								dislike_active = ' active';
								rate_again = '<li class="info-list"><section class="info-inset">I\'ll have the usual.<a href="javascript:void(0);" ontouchstart="rateBeer(' + id + ',\'dislike\',' + partner_id + ',' + true + ');" class="btn orange right" style="margin:-10px 0 0 0;">Drink Again?</a></section></li>';
								break;
						}
						if (results[0].addtodrink != null) {
							ed = 'ed';
							todrink_active = ' active';
						}
						
						$('#beer_detail').empty().attr('title',unescape(beer_name)).append('<li><ul class="rate_controls ' + id + '">'
															+ '<li ontouchstart="rateBeer(' + id + ',\'love\',' + partner_id + ',' + false + ',' + feed_id + ');" class="love' + love_active + '"><p class="rate_count right">' + love + '</p><span></span><section class="arrow-up' + love_active + '"></section></li>'
															+ '<li ontouchstart="rateBeer(' + id + ',\'like\',' + partner_id + ',' + false + ',' + feed_id + ');" class="like' + like_active + '"><p class="rate_count right">' + like + '</p><span></span><section class="arrow-up' + like_active + '"></section></li>'
															+ '<li ontouchstart="rateBeer(' + id + ',\'meh\',' + partner_id + ',' + false + ',' + feed_id + ');" class="meh' + meh_active + '"><p class="rate_count right">' + meh + '</p><span></span><section class="arrow-up' + meh_active + '"></section></li>'
															+ '<li ontouchstart="rateBeer(' + id + ',\'dislike\',' + partner_id + ',' + false + ',' + feed_id + ');" class="dislike' + dislike_active + '"><p class="rate_count right">' + dislike + '</p><span></span><section class="arrow-up' + dislike_active + '"></section></li>'
															+ '</ul></li>'
															+ rate_again
															+ '<li class="addToDrink ' + id + '' + todrink_active + '" ontouchstart="addToDrink(' + id + ',' + partner_id + ');">Add' + ed + ' to Drink List<span></span></li>'
															+ '<li id="' + id + '">'
															+ brewery
															+ abv
															+ category
															+ style
															+ description
															+ '</li>');
						
						// get location
						getLocation();
						
						window.location='dashboard.html#_beer_detail';
						load();
					} else {
						load('Something went wrong!','error');
					}
					isProcessing = false;
				},
		error: function() {
					load('Something went wrong!','error');
					isProcessing = false;
					return false;
				}
	});
}

function updateBeerCount(id,unrate) {
	var uncount = parseInt($('ul.' + id + ' li.' + unrate + ' p.rate_count').text()) - 1;
	
	// remove again option when rating changes
	$('.arrow-up').removeClass('active');
	$('.info-list').remove();
	console.log(uncount);
	if (uncount > 0) {
		$('ul.' + id + ' li.' + unrate + ' p.rate_count').empty().append(uncount);
	} else {
		$('ul.' + id + ' li.' + unrate + ' p.rate_count').empty();
	}
}



// --------------------------------------------------------------------------------------
// BEER DETAIL FUNCTIONS
// --------------------------------------------------------------------------------------

function addToDrink(id,partner_id) {
	load('Brewing...');
	if ($('li.' + id).hasClass('active')) {
		removeList = '';
		$('li.' + id).removeClass('active');
	} else {
		removeList = true;
		$('li.' + id).addClass('active');
	}
	
	if (isProcessing) { return false; } // Checks if in the middle of an ajax call
	
	$.ajax({
		cache: false,
		url: url + '/add-to-drink-list',
		data: { beer_id: id, removeList: removeList, partner_id: partner_id, user_id: user_id, user_name: username },
		success: function(results) {
					load();
					isProcessing = false;
				},
		error: function(results) {
					isProcessing = false;
					return false;
				}
	});
}

function rateBeer(id,rate,partner_id,again,feed_id) {
	load('Brewing...');
	
	var latitude = $('#latitude').val();
	var longitude = $('#longitude').val();
	
	console.log(latitude);
	console.log(longitude);
	
	var unrate = '';
	if (again == false) {
		if ($('ul.' + id + ' li').hasClass('active')) {
			if ($('ul.' + id + ' li.love').hasClass('active')) {
				unrate = 'love';
				updateBeerCount(id,unrate);
			} else if ($('ul.' + id + ' li.like').hasClass('active')) {
				unrate = 'like';
				updateBeerCount(id,unrate);
			} else if ($('ul.' + id + ' li.meh').hasClass('active')) {
				unrate = 'meh';
				updateBeerCount(id,unrate);
			} else if ($('ul.' + id + ' li.dislike').hasClass('active')) {
				unrate = 'dislike';
				updateBeerCount(id,unrate);
			}
			$('ul.' + id + ' li').removeClass('active');
		}
	}
	
	if ($('li.addToDrink.' + id).hasClass('active')) { addToDrink(id); }
	
	if (isProcessing) { return false; } // Checks if in the middle of an ajax call
	
	$.ajax({
		cahce: false,
		url: url + '/beer-checkin',
		data: { beer_id: id, rate: rate, unrate: unrate, latitude: latitude, longitude: longitude, partner_id: partner_id, feed_id: feed_id, again: again, user_id: user_id, user_name: username },
		dataType: 'json',
		success: function(results) {
					if (results.status == 'success') {
						load();
						var rate_count = $('ul.' + id + ' li.' + rate + ' p.rate_count');
						$('ul.' + id + ' li.' + rate).addClass('active');
						var count = parseInt(rate_count.text());
						if (rate_count.is(':empty')) {
							rate_count.append('1');
						} else {
							rate_count.empty().append(count + 1);
						}
						
						// Setup Share beer page
						$('#share li.share_button').empty().append('<a href="javascript:void(0);" ontouchstart="share(' + id + ',' + results.rate + ',' + results.feed_id + ');" class="btn orange">Bottom\'s Up</a>')
						$('#share textarea.comment').val('');
						
						window.location='dashboard.html#_share';
					} else {
						load('Something went wrong!','error');
					}
					isProcessing = false;
				},
		error: function(results) {
					isProcessing = false;
					return false;
				}
	});
}

function twitterToggle() {
	var tweet = $('ul.rate_controls li.twitter');
	if (tweet.hasClass('active')) {
		tweet.removeClass('active');
	} else {
		tweet.addClass('active');
	}
}

function share(beer_id,rate,feed_id) {
	load('Brewing...');
	var comment = encodeURIComponent($('#share textarea.comment').val());
	var send_tweet = ($('ul.rate_controls li.twitter').hasClass('active')) ? 'true' : 'false';
	
	if (isProcessing) { return false; } // Checks if in the middle of an ajax call
	
	$.ajax({
		cache: false,
		url: url + '/share-beer',
		data: { feed_id: feed_id, beer_id: beer_id, rating: rate, comment: comment, send_tweet: send_tweet, user_id: user_id },
		success: function(results) {
					if (results.status == 'success') {
						window.location='dashboard.html#_index';
						loadTab(0);
						pageHistory = [];
						load('Success!','success');
					} else {
						load('Something went wrong!','error');
					}
					isProcessing = false;
				},
		error: function(results) {
					isProcessing = false;
					return false;
				}
	});
}


// --------------------------------------------------------------------------------------
// ADD BEER
// --------------------------------------------------------------------------------------

function clearField(field,insert) {
	$(field).empty().append(insert).removeClass('active');
}

/* ADD BEER SETUP -------------------------------------------------------- */
function getAttributes() {

	getAddBeer('breweries');
/*
	getAddBeer('styles');
	getAddBeer('categories');
*/
	
	var q = $('#beer_name').val();
	
	// Puts search term into Beer title
	$('#add_beer_name').val(q);
	
	// reset add beer screen
	$('#add_beer_description').val('');
	$('input#add_beer_abv').val('');
	$('li.abv_attribute').addClass('hide');
	$('li.cat_attribute').addClass('hide');
	$('li.style_attribute').addClass('hide');
	$('li.abv_select').removeClass('active');
	$('li.cat_select').removeClass('active');
	clearBrewery();
	
	window.location='dashboard.html#_add_beer';
}

/* GET OPTIONS -------------------------------------------------------- */
function getAddBeer(type,cat_id) {

	var call, storage, load_msg, callback = null;
	
	switch(type) {
		case 'breweries':
			call = '/get-breweries';
			storage = 'brewery';
			load_msg = 'Loading Breweries...';
			callback = ''; // no function because it gets called before the user takes action
			break;
		case 'categories':
			call = '/get-beer-categories';
			storage = 'category';
			load_msg = 'Loading Categories...';
			break;
		case 'styles':
			call = '/get-beer-styles';
			storage = 'style';
			load_msg = 'Loading Styles...';
			break;
	}
	
	console.log(window.localStorage.getItem(storage));
	console.log('type: ' + type + ', cat_id: ' + cat_id + ', url: ' + url + call);
	
	if (window.localStorage.getItem(storage) != null) {
		load();
		if (type == 'styles') {
			loadStyles();
		} else if (type == 'categories') {
			loadCategories();
		}
		return false; 
	} else if (isProcessing) {
		load();
		return false;
	}
	
	load(load_msg);
	
	$.ajax({
		cache: false,
		url: url + call,
		data: { cat_id: cat_id },
		success: function(results) {
					load();
					console.log(results);
					window.localStorage.setItem(storage, JSON.stringify(results));
					
					if (type == 'styles') {
						loadStyles();
					} else if (type == 'categories') {
						loadCategories();
					}
				},
		error: function() {
					console.log('Something went wrong!');
					return false;
				}
	});
}
/*
function getBreweries() {
	
	console.log(window.localStorage.getItem("brewery"));
	
	if (window.localStorage.getItem("brewery") != undefined) {
		load();
		return false; 
	} else if (isProcessing) {
		load();
		return false;
	}
	
	load('Loading Breweries...');
	
	$.ajax({
		cache: false,
		url: url + '/get-breweries',
		success: function(results) {
					load();
					console.log(results);
					window.localStorage.setItem("brewery", JSON.stringify(results));					
				},
		error: function() {
					console.log('Something went wrong!');
					return false;
				}
	});
}
*/

/* LOAD OPTIONS -------------------------------------------------------- */
function loadBreweries() {
	
	var brewery_results = window.localStorage.getItem("brewery"),
		obj = JSON.parse(brewery_results);
	
	console.log(obj);
	console.log(obj.length);
	console.log($('#slide-up h1').text());
	
	load('Brewing...');
	
	if ($('#slide-up h1').text() != 'Breweries') {
		$('#slide-up span.results').empty().append('<ul id="brewery_list"></ul>');
		
		for (var i = 0; i < obj.length; i++) {
			$('#slide-up span.results #brewery_list').append('<li onclick="selectBrewery(' + i + ');">' + obj[i].name + '</li>');
		}
	}
	
	setTimeout(function() {
		myScroll = new iScroll('scroller', {
			vScrollbar: false,
			hScroll: false
		});
	},100);
	
	$('#slide-up h1').empty().append('Breweries');
	$('#slide-up').show().addClass('active');
	$('#brewery_name').val('').attr('placeholder','Find brewery');
	$('#brewery_name').fastLiveFilter('#brewery_list');
	load();

}
function loadCategories() {
	
	var category_results = window.localStorage.getItem("category"),
		obj = JSON.parse(category_results);
	
	console.log(obj);
	console.log(obj.length);
	console.log($('#slide-up h1').text());
	
	load('Brewing...');
	
	if ($('#slide-up h1').text() != 'Categories') {
		$('#slide-up span.results').empty().append('<ul id="category_list"></ul>');
		
		for (var i = 0; i < obj.length; i++) {
			$('#slide-up span.results #category_list').append('<li onclick="selectCategory(' + i + ');">' + obj[i].cat_name + '</li>');
		}
	}
	
	setTimeout(function() {
		myScroll = new iScroll('scroller', {
			vScrollbar: false,
			hScroll: false
		});
	},100);
	
	$('#slide-up h1').empty().append('Categories');
	$('#slide-up').show().addClass('active');
	$('#brewery_name').val('').attr('placeholder','Find category');
	$('#brewery_name').fastLiveFilter('#category_list');
	load();
}
function loadStyles() {
	
	var style_results = window.localStorage.getItem("style"),
		obj = JSON.parse(style_results);
	
	console.log(obj);
	console.log('got into loadStyles');
	console.log(obj.length);
	console.log($('#slide-up h1').text());
	
	load('Brewing...');
	
	if ($('#slide-up h1').text() != 'Styles') {
		$('#slide-up span.results').empty().append('<ul id="style_list"></ul>');
		
		for (var i = 0; i < obj.length; i++) {
			$('#slide-up span.results #style_list').append('<li onclick="selectStyle(' + i + ');">' + obj[i].style_name + '</li>');
		}
	}
	
	setTimeout(function() {
		myScroll = new iScroll('scroller', {
			vScrollbar: false,
			hScroll: false
		});
	},100);
	
	
	$('#slide-up h1').empty().append('Styles');
	$('#slide-up').show().addClass('active');
	$('#brewery_name').val('').attr('placeholder','Find style');
	$('#brewery_name').fastLiveFilter('#style_list');
	load();
}

/* SELECT OPTIONS -------------------------------------------------------- */
function selectBrewery(i) {

	var brewery_results = window.localStorage.getItem("brewery"),
		obj = JSON.parse(brewery_results);
	
	// TODO: Add clear button
	// '<a href="javascript:void(0);" onclick="clearfield(\'#add_beer_category\',\'Tap to add Brewery Name...\');" class="clearfield">x</a><b>Category:</b> '
	
	console.log('brewery name: ' + obj[i].name + ', value: ' + obj[i].value);
	console.log($('li#add_beer_brewery').html());
	
	$('li#add_beer_brewery').addClass('active').empty().append(obj[i].name).attr('data-value',obj[i].value);
	$('#slide-up').removeClass('active').hide();
}
function selectCategory(i) {

	var style_results = window.localStorage.getItem("category"),
		obj = JSON.parse(style_results);
		
	// TODO: Add clear button
	// '<a href="javascript:void(0);" onclick="clearfield(\'#add_beer_category\',\'Tap to add Brewery Name...\');" class="clearfield">x</a><b>Category:</b> '
	
	console.log('category name: ' + obj[i].cat_name + ', value: ' + obj[i].id);
	console.log($('li#add_beer_category').html());
	
	$('.cat_select').addClass('active');
	$('li#add_beer_category').addClass('active').removeClass('hide').empty().append(obj[i].cat_name).attr('data-value',obj[i].id);
	$('#slide-up').removeClass('active').hide();
	
	$('#add_beer_style').removeClass('hide');
	
	console.log(obj[i].id);
	getAddBeer('styles',obj[i].id);
}
function selectStyle(i) {

	var style_results = window.localStorage.getItem("style"),
		obj = JSON.parse(style_results);
	
	// TODO: Add clear button
	// '<a href="javascript:void(0);" onclick="clearfield(\'#add_beer_category\',\'Tap to add Brewery Name...\');" class="clearfield">x</a><b>Category:</b> '
	
	console.log('style name: ' + obj[i].style_name + ', value: ' + obj[i].id);
	console.log($('li#add_beer_style').html());
	
	$('li#add_beer_style').addClass('active').empty().append(obj[i].style_name).attr('data-value',obj[i].id);
	$('#slide-up').removeClass('active').hide();
}

/* ADD NEW BEER INTO DATABASE -------------------------------------------------------- */
function addNewBeer() { // TODO: check if any fields are empty before inserting into database
	load('Brewing...');
	var name = $('input#add_beer_name').val().toLowerCase().replace(/\b[a-z]/g, function(letter) { // Capitalize
	    return letter.toUpperCase();
	});
	var brewery_name = $('#add_beer_brewery').text().toLowerCase().replace(/\b[a-z]/g, function(letter) { // Capitalize
	    return letter.toUpperCase();
	});
	var brewery_id = $('#add_beer_brewery').attr('data-value'),
		description = $('#add_beer_description').val(),
		abv = $('input#add_beer_abv').val(), // TODO: Make sure it's only a number, with no percentage sign or letters
		category = $('#add_beer_category').attr('data-value'),
		style = $('#add_beer_style').attr('data-value');
	
	if (brewery_id != '') {
		brewery = brewery_id;
	} else if (brewery_name != '') {
		brewery = brewery_name;
	} else {
		brewery = 1425;
	}

	console.log('abv: ' + abv);
	console.log('category: ' + category);
	console.log('style: ' + style);

	if (category == undefined) {
		category = 11;
		console.log(category);
	}
	if (style == undefined) {
		style = 132;
	}
	if (!$('.abv_select').hasClass('active')) {
		abv = 0;
	}
	
	console.log('user_id: ' + user_id + ', user_name: ' + username);
	
	$.ajax({
		cache: false,
		url: url + '/new-beer',
		data: { name: name, brewery: brewery, description: description, abv: abv, category: category, style: style, user_id: user_id, user_name: username },
		success: function(results) {
					if (results.status == 'success') {
						showNewBeer(results.id);
					} else {
						load('Something went wrong!','error');
					}
				},
		error: function() {
					console.log('Something went wrong!');
					return false;
				}
	});
}


function showAttribute(id) {
	var field = $('.' + id + '_attribute');
	var select = $('.' + id + '_select');
	if (select.hasClass('active')) {
		select.removeClass('active');
		field.addClass('hide').val('');
		if (id == 'cat') {
			$('.style_attribute').addClass('hide').val('');
		}
	} else {
		field.removeClass('hide').val('');
		switch(id) {
			case 'cat':
				select.addClass('active');
				var cat = $('select#beer_categories option:selected').text();
				$('#add_beer_category').val(cat);
				$('select#beer_categories').focus();
				break;
			case 'style':
				var style = $('select#beer_styles option:selected').text();
				$('#add_beer_style').val(style);
				$('select#beer_styles').focus();
				break;
			case 'abv':
				select.addClass('active');
				$('input#add_beer_abv').focus();
				break;
		}
	}
}

/*
function getBreweries() {
	$.ajax({
		cache: false,
		url: url + '/get-breweries',
		success: function(breweries) {
					load();
					console.log(breweries);
					data = { items: breweries };
					$('input#add_beer_brewery').autoSuggest(data.items, {
						asHtmlID: 'brewery',
						startText: 'Brewery',
						limitText: 'You can only choose one brewery',
						selectedItemProp: 'name',
						selectedValuesProp: 'value',
						searchObjProps: 'name',
						retrieveLimit: 3,
						neverSubmit: true,
						selectionLimit: 1,
						selectionAdded: function() { $('#add_beer_description').focus(); $('#add_beer_form ul.as-selections li.as-original input').css('display','none'); },
						selectionRemoved: function() { clearBrewery(); }
					});
				},
		error: function() {
					console.log('Something went wrong!');
					return false;
				}
	});
}
function getBreweries() {
	$.ajax({
		cache: true,
		url: url + '/get-breweries',
		success: function(breweries) {
					load();
					console.log(breweries);
					$('#slide-up span.results').append('<ul id="brewery_list"></ul>');
					for (var i = 0; i < breweries.length; i++) {
						$('#slide-up span.results #brewery_list').append('<li onclick="selectBrewery("' + breweries[i].name + '",' + breweries[i].value + ')">' + breweries[i].name + '</li>');
					}
					$('#slide-up').addClass('active');
					$('#brewery_name').fastLiveFilter('#brewery_list');
				},
		error: function() {
					console.log('Something went wrong!');
					return false;
				}
	});
}
function getBeerCategories() {
	load('Brewing...');
	$.ajax({
		cache: false,
		url: url + '/get-beer-categories',
		success: function(results) {
					console.log(results);
					if (results != '') {
						$('select#beer_categories').empty();
						for(var i = 0; i < results.length; i++) {
							var selected = (i == 0) ? 'selected="selected"' : '';
							$('select#beer_categories').append('<option val="' + results[i].id + '" ' + selected + '>' + results[i].cat_name + '</option>');
						}
						load();
					} else {
						load('Something went wrong!','error');
					}
				},
		error: function() {
					load('Something went wrong!','error');
					console.log('Something went wrong!');
					return false;
				}
	});
}
function getBeerStyles(id) {
	load('Brewing...');
	$.ajax({
		cache: false,
		url: url + '/get-beer-styles',
		data: { cat_id: id },
		success: function(results) {
					if (results != '') {
						$('select#beer_styles').empty();
						for(var i = 0; i < results.length; i++) {
							$('select#beer_styles').append('<option val="' + results[i].id + '">' + results[i].style_name + '</option>');
						}
						showAttribute('style');
						load();
					} else {
						load('Something went wrong!','error');
					}
				},
		error: function() {
					load('Something went wrong!','error');
					console.log('Something went wrong!');
					return false;
				}
	});
}
*/

function updateBeerCategory() {
	var id = $('select#beer_categories option:selected').attr('val');
	var cat = $('select#beer_categories option:selected').text();
	$('#add_beer_category').val(cat);
	getBeerStyles(id);
}
function updateBeerStyle() {
	var style = $('select#beer_styles option:selected').text();
	$('#add_beer_style').val(style);
}
function clearBrewery() {
	$('#add_beer_form ul.as-selections li.as-original input').css('display','block');
	$('#add_beer_form input.as-values').val('');
	$('#add_beer_form ul.as-selections li.as-selection-item').remove();
}
/*
function addNewBeer() { // TODO: check if any fields are empty before inserting into database
	load('Brewing...');
	var name = $('input#add_beer_name').val().toLowerCase().replace(/\b[a-z]/g, function(letter) { // Capitalize
	    return letter.toUpperCase();
	});
	var obj = $('#as-selections-brewery li');
	var breweryArray = $.makeArray(obj);
	var brewery_name = $(breweryArray[0]).text().toLowerCase().replace(/\b[a-z]/g, function(letter) { // Capitalize
	    return letter.toUpperCase();
	});
	var brewery_input = $('input#brewery').val().toLowerCase().replace(/\b[a-z]/g, function(letter) { // Capitalize
	    return letter.toUpperCase();
	});
	var brewery = $('input#as-values-brewery').val().toLowerCase().replace(/\b[a-z]/g, function(letter) { // Capitalize
	    return letter.toUpperCase();
	});
	var description = $('#add_beer_description').val();
	var abv = $('input#add_beer_abv').val();
	var category = $('select#beer_categories option:selected').attr('val');
	var style = $('select#beer_styles option:selected').attr('val');
	
	if (brewery == '') {
		if (brewery_name != '') {
			brewery = brewery_name;
		} else if (brewery_input != '') {
			brewery = brewery_input;
		} else {
			brewery = 1425;
		}
	}
	console.log('abv: ' + abv);
	console.log('category: ' + category);
	console.log('style: ' + style);
	if (category == undefined) {
		category = 11;
		console.log(category);
	}
	if (style == undefined) {
		style = 132;
	}
	if (!$('.abv_select').hasClass('active')) {
		abv = 0;
	}
	$.ajax({
		cache: false,
		url: url + '/new-beer',
		data: { name: name, brewery: brewery, description: description, abv: abv, category: category, style: style, user_id: user_id, user_name: username },
		success: function(results) {
					if (results.status == 'success') {
						showNewBeer(results.id);
					} else {
						load('Something went wrong!','error');
					}
				},
		error: function() {
					console.log('Something went wrong!');
					return false;
				}
	});
}
*/
function showNewBeer(data) {
	load('Beer added successfully!');
	console.log(data);
	if (data != undefined) {
		beerDetail(data);
	}
}




// --------------------------------------------------------------------------------------
// PROFILE
// --------------------------------------------------------------------------------------

function loadProfile(id,notification) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	load('Brewing...');
	
	// resets footer
	$('#add_comment').removeClass('active');
	$('#footer').addClass('active');
	
	if (id == 0) {
		id = user_id;
		pageHistory = [];
		tabSelect('profile');
	}
	if (notification == true) {
		$('#notifier').removeClass('active');
	}
	
	console.log(id);
	console.log(user_id);
	
	$.ajax({
		cache: false,
		url: url + '/get-profile',
		data: { user_id: id, current_user_id: user_id, user_name: username },
		success: function(results) {
					if (results != '') {
						// Profile heading
						var first_name = (results[0].first_name == null) ? '' : results[0].first_name;
						var last_name = (results[0].last_name == null) ? '' : results[0].last_name;
						var user_name = first_name + ' ' + last_name;
						var profile_user_id = results[0].user_id;
						var location = (results[0].location == null) ? '' : '<p class="meta">' + results[0].location + '</p>';
						var activity = (results[0].beer_name == undefined) ? '' : '<li><p class="meta">Last seen drinking a <b>' + results[0].beer_name + '</b></p></li>';
						
						console.log('after ajax: ' + user_id);
						console.log('after ajax: ' + profile_user_id);
						// console.log(created_date);
						
						if (user_id != profile_user_id) {
							var follow  = (results[0].created_date == null) ? '<li><a href="javascript:void(0);" onclick="follow(' + id + ');" class="btn orange ' + id + '">Follow</a></li>' : '<li><a href="javascript:void(0);" onclick="unfollow(' + id + ');" class="btn light ' + id + '">Unfollow</a></li>';
							var profile_settings = '';
						} else {
							// My profile
							var follow = '';
							var profile_settings = '<li><ul id="profile_meta"><li onclick="loadNotifications();"><span class="icon notifications center"></span></li><li ontouchstart="window.location=\'dashboard.html#_profile_settings\';"><span class="icon settings center"></span></li></ul></li>';
						}

						$('ul#profile').attr('title',user_name).empty();
						$('ul#profile').append('<li style="height:60px;">'
											+ '<img src="' + results[0].avatar + '" width="48px" class="avatar left" />'
											+ '<h3>' + user_name + '</h3>'
											+ location
											+ '</li>'
											+ activity
											+ follow
											+ profile_settings
											+ '<li class="profile_item"><a href="javascript:void(0);" onclick="loadToDrink(' + profile_user_id + ');"><section class="icon arrow right"></section><span>' + results[0].todrink_count + '</span><b>To Drink list</b></a></li>'
											+ '<li class="profile_item"><a href="javascript:void(0);" onclick="loadActivity(' + profile_user_id + ');"><section class="icon arrow right"></section><span>' + results[0].beer_count + '</span><b>Beers</b></a></li>'
											+ '<li class="profile_item"><a href="javascript:void(0);" onclick="loadFollowers(' + profile_user_id + ');"><section class="icon arrow right"></section><span>' + results[0].follower_count + '</span><b>Followers</b></a></li>'
											+ '<li class="profile_item"><a href="javascript:void(0);" onclick="loadFollowing(' + profile_user_id + ');"><section class="icon arrow right"></section><span>' + results[0].following_count + '</span><b>Following</b></a></li>');
						
						window.location='dashboard.html#_profile';
						load();
					}
				},
		error: function(results) {
					load('Something went wrong!','error');
					return false;
				}
	});
}

function loadToDrink(user_id) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	load('Brewing...');
	$.ajax({
		cache: false,
		url: url + '/get-to-drink-list',
		data: { user_id: user_id },
		success: function(results) {
					if (results != '') {
						$('#profile_detail').empty();
						for (var i = 0; i < results.length; i++) {
							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
							var brewery = '<p class="meta">' + results[i].brewery + '</p>';
							$('#profile_detail').attr('title','To Drink').append('<li>'
														+ '<a href="javascript:void(0);" onclick="beerDetail(\'' + results[i].beer_id + '\')">'
														+ '<section class="icon arrow right"></section>'
														+ beer_name
														+ brewery
														+ '</a></li>');
						}
						window.location='dashboard.html#_profile_detail';
						load();
					} else {
						load('To Drink list is empty!','error');
					}
				},
		error: function(results) {
					load('Something went wrong!','error');
					return false;
				}
	});
}

function loadActivity(user_id) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	load('Brewing...');
	$.ajax({
		cache: false,
		url: url + '/get-activity',
		data: { user_id: user_id },
		success: function(results) {
					if (results != '') {
						$('#profile_detail').empty();
						for(var i = 0; i < results.length; i++) {
							var action = '';
							if (results[i].rating != '') {
								switch(results[i].rating) {
									case 1:
										action = 'loves';
										break;
									case 2:
										action = 'likes';
										break;
									case 3:
										action = 'is meh about';
										break;
									case 4:
										action = 'dislikes';
										break;
								}
							}
							var item_heading = '<p class="meta">' + results[i].first_name + ' ' + action + '</p>';
							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
							$('#profile_detail').attr('title','Beers').append('<li>'
												+ '<a href="#beer_detail" onclick="beerDetail(\'' + results[i].beer_id + '\')">'
												+ '<section class="icon arrow right"></section>'
												+ item_heading
												+ beer_name
												+ '</a></li>');
						}
						window.location='dashboard.html#_profile_detail';
						load();
					} else {
						load('No beers have been drank yet!','error');
					}
				},
		error: function(results) {
					load('Something went wrong!','error');
					return false;
				}
	});
}

function loadFollowers(user_id) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	load('Brewing...');
	$.ajax({
		cache: false,
		url: url + '/get-followers',
		data: { user_id: user_id },
		success: function(results) {
					if (results != '') {
						$('#profile_detail').empty();
						for(var i = 0; i < results.length; i++) {
							var first_name = (results[i].first_name == null) ? '' : results[i].first_name;
							var last_name = (results[i].last_name == null) ? '' : results[i].last_name;
							var followers_user_id = results[i].user_id;
							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
							var avatar = results[i].avatar;
							var location = (results[i].location == null) ? '' : '<p class="meta">' + results[i].location + '</p>';
							
							$('#profile_detail').attr('title','Followers').append('<li style="height:55px;">'
																+ '<a href="#profile" id="' + followers_user_id + '" onclick="javascript:loadProfile(' + followers_user_id + ');">'
																+ '<section class="icon arrow right"></section>'
							 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
																+ '<h3>' + first_name + ' ' + last_name + '</h3>'
																+ location
							 									+ '</a></li>');
						}
						window.location='dashboard.html#_profile_detail';
						load();
					} else {
						load('No Followers!','error');
					}
				},
		error: function(results) {
					load();
					return false;
				}
	});
}

function loadFollowing(user_id) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	load('Brewing...');
	$.ajax({
		cache: false,
		url: url + '/get-following',
		data: { user_id: user_id },
		success: function(results) {
					if (results != '') {
						$('#profile_detail').empty();
						for(var i = 0; i < results.length; i++) {
							var first_name = (results[i].first_name == null) ? '' : results[i].first_name;
							var last_name = (results[i].last_name == null) ? '' : results[i].last_name;
							var following_user_id = results[i].user_id;
							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
							var avatar = results[i].avatar;
							$('#profile_detail').attr('title','Following').append('<li style="height:55px;">'
																+ '<a href="#profile" id="' + following_user_id + '" onclick="javascript:loadProfile(' + following_user_id + ');">'
																+ '<section class="icon arrow right"></section>'
							 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
																+ '<h3>' + first_name + ' ' + last_name + '</h3>'
							 									+ '</a></li>');
						}
						window.location='dashboard.html#_profile_detail';
						load();
					} else {
						load('Not Following anyone!','error');
					}
				},
		error: function(results) {
					load();
					return false;
				}
	});
}

function follow(id) {
	load('Brewing...');
	var style = $('a.' + id).attr('style');
	
	$.ajax({
		cache: false,
		url: url + '/follow',
		data: { owner_id: id, user_id: user_id },
		success: function(results) {
					if (results != '') {
						$('a.' + id).replaceWith('<a href="javascript:void(0);" ontouchstart="unfollow(' + id + ');" class="btn light ' + id + '" style="' + style + '">Unfollow</a>');
						load();
					} else {
						load('Something went wrong!','error');
						console.log('There was an error!');
					}
				},
		error: function(results) {
					return false;
				}
	});
}

function unfollow(id) {
	load('Brewing...');
	var style = $('a.' + id).attr('style');
	
	$.ajax({
		cache: false,
		url: url + '/unfollow',
		data: { owner_id: id, user_id: user_id },
		success: function(results) {
					if (results != '') {
						$('a.' + id).replaceWith('<a href="javascript:void(0);" ontouchstart="follow(' + id + ');" class="btn orange ' + id + '" style="' + style + '">Follow</a>');
						load();
					} else {
						load('Something went wrong!','error');
						console.log('There was an error!');
					}
				},
		error: function(results) {
					return false;
				}
	});
}
function addComment(beer_id,rate,feed_id,owner_id) {
	
	$('html, body').animate({scrollTop: '0px'}, 0);
	// $('#add_comment').css({'bottom':'0'});
	
	var comment = $('#add_comment_text').val();
	if (comment != '') {
		var answer = confirm("Post comment?");
	} else {
		return false;
	}
	
	if (answer) {
		load('Brewing...');
		$.ajax({
			cache: false,
			url: url + '/add-comment',
			data: { beer_id: beer_id, rating: rate, feed_id: feed_id, comment: comment, owner_id: owner_id, user_id: user_id },
			success: function(results) {
						if (results != '') {
							
							var first_name = (results[0].first_name == null) ? '' : results[0].first_name;
							var last_name = (results[0].last_name == null) ? '' : results[0].last_name;
							var user_name = first_name + ' ' + last_name;
							
							load('Comment added!','success');
							$('#add_comment_text').val('');
							$('ul#feed_detail span.results').append('<li>'
												+ '<a href="javascript:void(0);" ontouchstart="loadProfile(\'' + results[0].user_id + '\')">'
												+ '<img src="' + results[0].avatar + '" width="32px" class="avatar left" />'
												+ '<time class="right">just now</time>'
												+ '<p class="meta">' + user_name + '</p>'
												+ '<p class="comment">' + comment + '</p>'
												+ '</a></li>');
							// loadTab(0,'comment');
						} else {
							load('Something went wrong!','error');
						}
					},
			error: function(results) {
						return false;
					}
		});
	} else {
		return false;
	}
}


// --------------------------------------------------------------------------------------
// PROFILE
// --------------------------------------------------------------------------------------

// function loadProfile(id,notification) {
// 	$('html, body').animate({scrollTop: '0px'}, 0);
// 	load('Brewing...');
// 	
// 	// resets footer
// 	$('#add_comment').fadeOut();
// 	$('#footer').fadeIn();
// 	
// 	if (notification == true) {
// 		$('#notifier').removeClass('active');
// 	}
// 	
// 	$.ajax({
// 		cache: false,
// 		url: url + '/get-profile',
// 		data: { user_id: id },
// 		success: function(results) {
// 					if (results != '') {
// 						// Profile heading
// 						var first_name = (results[0].first_name == null) ? '' : results[0].first_name;
// 						var last_name = (results[0].last_name == null) ? '' : results[0].last_name;
// 						var user_name = first_name + ' ' + last_name;
// 						var user_id = results[0].user_id;
// 						var activity = (results[0].beer_name == undefined) ? '' : '<p class="meta">Last seen drinking a <b>' + results[0].beer_name + '</b></p>';
// 						
// 						if (results[0].user_id != $('#user_id').val()) {
// 							var follow  = (results[0].created_date == null) ? '<li><a href="javascript:void(0);" ontouchstart="follow(' + id + ');" class="btn orange ' + id + '">Follow</a></li>' : '<li><a href="javascript:void(0);" ontouchstart="unfollow(' + id + ');" class="btn light ' + id + '">Unfollow</a></li>';
// 							var profile_settings = '';
// 						} else {
// 							// My profile
// 							tabSelect('profile');
// 							var follow = '';
// 							var profile_settings = '<li><ul id="profile_meta"><li ontouchstart="loadNotifications();"><span class="icon notifications center"></span></li><li ontouchstart="window.location=\'dashboard.html#_profile_settings\';"><span class="icon settings center"></span></li></ul></li>';
// 						}
// 
// 						$('ul#profile').attr('title',user_name).empty();
// 						$('ul#profile').append('<li style="height:60px;">'
// 											+ '<img src="' + results[0].avatar + '" width="48px" class="avatar left" />'
// 											+ '<h3>' + user_name + '</h3>'
// 											+ activity
// 											+ '</ul>'
// 											+ '</li>'
// 											+ follow
// 											+ profile_settings
// 											+ '<li class="profile_item"><a href="javascript:void(0);" ontouchstart="loadToDrink(' + user_id + ');"><section class="icon arrow right"></section><span>' + results[0].todrink_count + '</span><b>To Drink list</b></a></li>'
// 											+ '<li class="profile_item"><a href="javascript:void(0);" ontouchstart="loadActivity(' + user_id + ');"><section class="icon arrow right"></section><span>' + results[0].beer_count + '</span><b>Beers</b></a></li>'
// 											+ '<li class="profile_item"><a href="javascript:void(0);" ontouchstart="loadFollowers(' + user_id + ');"><section class="icon arrow right"></section><span>' + results[0].follower_count + '</span><b>Followers</b></a></li>'
// 											+ '<li class="profile_item"><a href="javascript:void(0);" ontouchstart="loadFollowing(' + user_id + ');"><section class="icon arrow right"></section><span>' + results[0].following_count + '</span><b>Following</b></a></li>');
// 						
// 						window.location='dashboard.html#_profile';
// 						load();
// 					}
// 				},
// 		error: function(results) {
// 					load('Something went wrong!','error');
// 					return false;
// 				}
// 	});
// }
// 
// function loadToDrink(user_id) {
// 	$('html, body').animate({scrollTop: '0px'}, 0);
// 	load('Brewing...');
// 	$.ajax({
// 		cache: false,
// 		url: url + '/get-to-drink-list',
// 		data: { user_id: user_id },
// 		success: function(results) {
// 					if (results != '') {
// 						$('#profile_detail').empty();
// 						for (var i = 0; i < results.length; i++) {
// 							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
// 							var brewery = '<p class="meta">' + results[i].brewery + '</p>';
// 							$('#profile_detail').attr('title','To Drink').append('<li>'
// 														+ '<a href="javascript:void(0);" ontouchstart="beerDetail(\'' + results[i].beer_id + '\')">'
// 														+ '<section class="icon arrow right"></section>'
// 														+ beer_name
// 														+ brewery
// 														+ '</a></li>');
// 						}
// 						window.location='dashboard.html#_profile_detail';
// 						load();
// 					} else {
// 						load('To Drink list is empty!','error');
// 					}
// 				},
// 		error: function(results) {
// 					load('Something went wrong!','error');
// 					return false;
// 				}
// 	});
// }
// 
// function loadActivity(user_id) {
// 	$('html, body').animate({scrollTop: '0px'}, 0);
// 	load('Brewing...');
// 	$.ajax({
// 		cache: false,
// 		url: url + '/get-activity',
// 		data: { user_id: user_id },
// 		success: function(results) {
// 					if (results != '') {
// 						$('#profile_detail').empty();
// 						for(var i = 0; i < results.length; i++) {
// 							var action = '';
// 							if (results[i].rating != '') {
// 								switch(results[i].rating) {
// 									case 1:
// 										action = 'loves';
// 										break;
// 									case 2:
// 										action = 'likes';
// 										break;
// 									case 3:
// 										action = 'is meh about';
// 										break;
// 									case 4:
// 										action = 'dislikes';
// 										break;
// 								}
// 							}
// 							var item_heading = '<p class="meta">' + results[i].first_name + ' ' + action + '</p>';
// 							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
// 							$('#profile_detail').attr('title','Beers').append('<li>'
// 												+ '<a href="#beer_detail" ontouchstart="beerDetail(\'' + results[i].beer_id + '\')">'
// 												+ '<section class="icon arrow right"></section>'
// 												+ item_heading
// 												+ beer_name
// 												+ '</a></li>');
// 						}
// 						window.location='dashboard.html#_profile_detail';
// 						load();
// 					} else {
// 						load('No beers have been drank yet!','error');
// 					}
// 				},
// 		error: function(results) {
// 					load('Something went wrong!','error');
// 					return false;
// 				}
// 	});
// }
// 
// function loadFollowers(user_id) {
// 	$('html, body').animate({scrollTop: '0px'}, 0);
// 	load('Brewing...');
// 	$.ajax({
// 		cache: false,
// 		url: url + '/get-followers',
// 		data: { user_id: user_id },
// 		success: function(results) {
// 					if (results != '') {
// 						$('#profile_detail').empty();
// 						for(var i = 0; i < results.length; i++) {
// 							var first_name = (results[i].first_name == null) ? '' : results[i].first_name;
// 							var last_name = (results[i].last_name == null) ? '' : results[i].last_name;
// 							var user_id = results[i].user_id;
// 							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
// 							var avatar = results[i].avatar;
// 							$('#profile_detail').attr('title','Followers').append('<li style="height:55px;">'
// 																+ '<a href="#profile" id="' + user_id + '" ontouchstart="javascript:loadProfile(' + user_id + ');">'
// 																+ '<section class="icon arrow right"></section>'
// 							 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
// 																+ '<h3>' + first_name + ' ' + last_name + '</h3>'
// 							 									+ '</a></li>');
// 						}
// 						window.location='dashboard.html#_profile_detail';
// 						load();
// 					} else {
// 						load('No Followers!','error');
// 					}
// 				},
// 		error: function(results) {
// 					load();
// 					return false;
// 				}
// 	});
// }
// 
// function loadFollowing(user_id) {
// 	$('html, body').animate({scrollTop: '0px'}, 0);
// 	load('Brewing...');
// 	$.ajax({
// 		cache: false,
// 		url: url + '/get-following',
// 		data: { user_id: user_id },
// 		success: function(results) {
// 					if (results != '') {
// 						$('#profile_detail').empty();
// 						for(var i = 0; i < results.length; i++) {
// 							var first_name = (results[i].first_name == null) ? '' : results[i].first_name;
// 							var last_name = (results[i].last_name == null) ? '' : results[i].last_name;
// 							var user_id = results[i].user_id;
// 							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
// 							var avatar = results[i].avatar;
// 							$('#profile_detail').attr('title','Following').append('<li style="height:55px;">'
// 																+ '<a href="#profile" id="' + user_id + '" ontouchstart="javascript:loadProfile(' + user_id + ');">'
// 																+ '<section class="icon arrow right"></section>'
// 							 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
// 																+ '<h3>' + first_name + ' ' + last_name + '</h3>'
// 							 									+ '</a></li>');
// 						}
// 						window.location='dashboard.html#_profile_detail';
// 						load();
// 					} else {
// 						load('Not Following anyone!','error');
// 					}
// 				},
// 		error: function(results) {
// 					load();
// 					return false;
// 				}
// 	});
// }
// 
// function follow(id) {
// 	load('Brewing...');
// 	var style = $('a.' + id).attr('style');
// 	
// 	$.ajax({
// 		cache: false,
// 		url: url + '/follow',
// 		data: { owner_id: id, user_id: user_id },
// 		success: function(results) {
// 					if (results != '') {
// 						$('a.' + id).replaceWith('<a href="javascript:void(0);" ontouchstart="unfollow(' + id + ');" class="btn light ' + id + '" style="' + style + '">Unfollow</a>');
// 						load();
// 					} else {
// 						load('Something went wrong!','error');
// 						console.log('There was an error!');
// 					}
// 				},
// 		error: function(results) {
// 					return false;
// 				}
// 	});
// }
// 
// function unfollow(id) {
// 	load('Brewing...');
// 	var style = $('a.' + id).attr('style');
// 	
// 	$.ajax({
// 		cache: false,
// 		url: url + '/unfollow',
// 		data: { owner_id: id, user_id: user_id },
// 		success: function(results) {
// 					if (results != '') {
// 						$('a.' + id).replaceWith('<a href="javascript:void(0);" ontouchstart="follow(' + id + ');" class="btn orange ' + id + '" style="' + style + '">Follow</a>');
// 						load();
// 					} else {
// 						load('Something went wrong!','error');
// 						console.log('There was an error!');
// 					}
// 				},
// 		error: function(results) {
// 					return false;
// 				}
// 	});
// }


// --------------------------------------------------------------------------------------
// SEARCH
// --------------------------------------------------------------------------------------

function findBeer() {
	
	var name = $.trim($('input#beer_name').val());
	$('#find_beer span.results').empty().append('<li class="loader"><p class="meta">Brewing...</p></li>');
	
	if (name != '' && name.length > 1) {
		$.ajax({
			cache: false,
			url: url + '/find-beer',
			data: { beer_name: name },
			dataType: 'json',
			success: function(results) {
						
						var search_help = '<li class="meta">'
											+ '<h3>Not What You\'re Looking For?</h3>'
											+ '<ul>'
											+ '<li><p>Double check the spelling</p></li>'
											+ '<li><p>Try searching just the beer name, not the brewery (ex. Choklat instead of Southern Tier Choklat)</p></li>'
											+ '<li><p>Try searching part of the beer name (ex. Heine instead of Heineken)</p></li>'
											+ '</ul>'
											'</li>'
						
						if (results != '') {
							$('ul#find_beer span.results').empty();
							for(var i = 0; i < results.length; i++) {
								var id = results[i].id;
								var brewery_id = results[i].brewery_id;
								var beer_name = '<h3>' + results[i].name + '</h3>';
								var brewery = '<p class="meta">' + results[i].brewery + '</p>';
								$('ul#find_beer span.results').append('<li>'
																	+ '<a href="javascript:void(0);" id="' + id + '" onclick="javascript:beerDetail(' + id + ');">'
																	+ '<section class="icon arrow right"></section>'
								 									+ beer_name
																	+ brewery
								 									+ '</a></li>');
							}
							if (results.length < 5) {
								$('ul#find_beer span.results').append(search_help + '<li class="no_bg"><a href="javascript:void(0);" ontouchstart="getAttributes();" class="ac btn orange">Add New Beer</a></li>');
							} else {
								$('ul#find_beer span.results').append(search_help + '<li class="no_bg"><a href="javascript:void(0);" ontouchstart="getAttributes();" class="ac btn orange">Add New Beer</a></li>');
							}
						} else {
							$('ul#find_beer span.results').empty().append(search_help + '<li class="no_bg"><a href="javascript:void(0);" ontouchstart="getAttributes();" class="ac btn orange">Add New Beer</a></li>');
						}
					},
			error: function(results) {
						$('#find_beer span.results').empty().append('<li class="loader"><p class="meta">Something went wrong!</p></li>');
						return false;
					}
		});
	}
}

function findFriend() {
	
	var name = $.trim($('input#search_user').val());
	$('#find_friend span.results').empty().append('<li class="loader"><p class="meta">Brewing...</p></li>');
	
	if (name != '' && name.length > 1) {
		$.ajax({
			cache: false,
			url: url + '/find-friend',
			data: { user_name: name },
			dataType: 'json',
			success: function(results) {
						if (results != '') {
							$('ul#find_friend span.results').empty();
							for(var i = 0; i < results.length; i++) {
								var first_name = (results[i].first_name == null) ? '' : results[i].first_name;
								var last_name = (results[i].last_name == null) ? '' : results[i].last_name;
								var user_id = results[i].user_id;
								var beer_name = '<h3>' + results[i].beer_name + '</h3>';
								var avatar = results[i].avatar;
								$('ul#find_friend span.results').append('<li style="height:55px;">'
																	+ '<a href="#profile" id="' + user_id + '" ontouchstart="javascript:loadProfile(' + user_id + ');">'
																	+ '<section class="icon arrow right"></section>'
								 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
																	+ '<h3>' + first_name + ' ' + last_name + '</h3>'
								 									+ '</a></li>');
							}
						} else {
							$('ul#find_friend span.results').empty().append('<li class="loader"><p class="meta">No one by that name, try searching for another drinking buddy</p></li>');
						}
					},
			error: function(results) {
						$('#find_friend span.results').empty().append('<li class="loader"><p class="meta">Something went wrong!</p></li>');
						return false;
					}
		});
	}
}



// --------------------------------------------------------------------------------------
// NOTIFICATIONS
// --------------------------------------------------------------------------------------

function getNotifications() {
	var user_id = $('input#user_id').val();
	var user_name = $('input#user_name').val();
	if (user_name != '' || user_id != '') {
		$.ajax({
			cache: false,
			url: url + '/get-notifications',
			data: { user_id: user_id },
			success: function(results) {
						var message = '';
						if (results != '') {
							if (results.length > 1) {
								$('#notifier').empty().append('<a href="javascript:void(0);" ontouchstart="loadNotifications();">You have ' + results.length + ' new notifications!</a>').addClass('active');
							} else {
								switch(results[0].type) {
									case 'COMMENT':
										message = '<a href="javascript:void(0);" ontouchstart="feedDetail(' + results[0].feed_id + ',true);">You have a new comment!</a>';
										break;
									case 'FOLLOW':
										message = '<a href="javascript:void(0);" ontouchstart="loadProfile(' + results[0].partner_id + ',true);">You have a new follower!</a>';
										break;
									case 'RATE':
										message = '<a href="javascript:void(0);" ontouchstart="feedDetail(' + results[0].feed_id + ',true);">Your beer was tasted!</a>';
										break;
									case 'LIST':
										message = '<a href="javascript:void(0);" ontouchstart="feedDetail(' + results[0].feed_id + ',true);">Your beer was added as a To Drink!</a>';
										break;
								}
								$('#notifier').empty().append(message).addClass('active');
							}
						}
					},
			error: function(results) {
						load('Something went wrong!','error');
						return false;
					}
		});
	}
}

function loadNotifications() {
	
	clearNotificationsAndBadgeNative();
	
	$.ajax({
		cache: false,
		url: url + '/get-notifications-list',
		data: { user_id: user_id },
		success: function(results) {
					var message = '';
					if (results != '') {
						$('#profile_detail').empty().attr('title','Notifications');
						for(var i = 0; i < results.length; i++) {
							
							var first_name = (results[i].first_name == undefined) ? '' : results[i].first_name;
							var last_name = (results[i].last_name == undefined) ? '' : results[i].last_name;
							var avatar = results[i].avatar;
							var time = (results[i].time == undefined) ? '' : fixTime(results[i].time);
							var unread = (results[i].read == 0) ? ' class="unread"' : '';
							
							switch(results[i].type) {
								case 'COMMENT':
									message = '<a href="javascript:void(0);" onclick="feedDetail(' + results[i].feed_id + ');">'
												+ '<section class="icon arrow right"></section>'
												+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
												+ '<span class="info">' + time + '</span>'
												+ '<p class="meta"><b>' + first_name + ' ' + last_name + '</b><br /> left you a comment</p></a>';
									break;
								case 'FOLLOW':
									message = '<a href="javascript:void(0);" onclick="loadProfile(' + results[i].partner_id + ');">'
												+ '<section class="icon arrow right"></section>'
												+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
												+ '<span class="info">' + time + '</span>'
												+ '<p class="meta"><b>' + first_name + ' ' + last_name + '</b><br /> is now following you</p></a>';
									break;
								case 'RATE':
									message = '<a href="javascript:void(0);" onclick="feedDetail(' + results[i].feed_id + ');">'
												+ '<section class="icon arrow right"></section>'
												+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
												+ '<span class="info">' + time + '</span>'
												+ '<p class="meta"><b>' + first_name + ' ' + last_name + '</b><br /> tried one of your beers</p></a>';
									break;
								case 'LIST':
									message = '<a href="javascript:void(0);" onclick="feedDetail(' + results[i].feed_id + ');">'
												+ '<section class="icon arrow right"></section>'
												+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
												+ '<span class="info">' + time + '</span>'
												+ '<p class="meta"><b>' + first_name + ' ' + last_name + '</b><br /> added your beer to their <b>To Drink</b> list</p></a>';
									break;
							}
							$('#profile_detail').append('<li style="height:45px;"' + unread + '>' + message + '</li>');
						}
						window.location='dashboard.html#_profile_detail';
						
						// Remove any notifications
						$('#notifier').removeClass('active');
					} else {
						load('You have no notifications!','error');
					}
				},
		error: function(results) {
					load('Something went wrong!','error');
					return false;
				}
	});
}


// --------------------------------------------------------------------------------------
// LOCATIONS
// --------------------------------------------------------------------------------------
 
function findDistance(lat1,lon1,lat2,lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = (lat2*57.29578)-(lat1*57.29578);  // Javascript functions in radians
	var dLon = (lon2*57.29578)-(lon1*57.29578); 
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.cos(lat1*57.29578) * Math.cos(lat2*57.29578) * 
	        Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km to feet
	return Math.round(d);
}

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition( 

		function (position) {

			lat = position.coords.latitude;
			lon = position.coords.longitude;
			ll = lat + ',' + lon;
		
			$('#latitude').val(lat);
			$('#longitude').val(lon);
		
		}, 
		// next function is the error callback
		function (error) {
			switch(error.code) 
			{
				case error.TIMEOUT:
					load('Timeout','error');
					break;
				case error.POSITION_UNAVAILABLE:
					load('Position unavailable','error');
					break;
				case error.PERMISSION_DENIED:
					load('Permission denied','error');
					break;
				case error.UNKNOWN_ERROR:
					load('Something went wrong!','error');
					break;
			}
		});
	}
}

// --------------------------------------------------------------------------------------
// REGISTRATION
// --------------------------------------------------------------------------------------

function finishRegistration() {
	load('Brewing...');
	var first_name = $('input#first_name').val(),
		last_name = $('input#last_name').val(),
		email = ($('input#email').val() == '') ? null : $('input#email').val(),
		location = ($('input#location').val() == '') ? null : $('input#location').val();
	
	$.ajax({
		cache: false,
		url: url + '/update-user',
		data: { first_name: first_name, last_name: last_name, email: email, location: location },
		success: function(results) {
					if (results.status == 'success') {
						window.location='dashboard.html#registration';
					} else {
						load('Something went wrong!','error');
						return false;
					}
				},
		error: function() {
					load('Something went wrong!','error');
					return false;
				}
	});
}

function followStout() {
	load('Brewing...');
	$.ajax({
		cache: false,
		url: url + '/follow-stoutapp',
		success: function(results) {
				if (results.status == 'success') {
					$('#follow_stout a').replaceWith('<a href="javascript:void(0);" class="btn light right">Followed!</a>');
					load();
				}
			},
		error: function(results) {
				load('Something went wrong!','error');
				return false;
			}
	});
}

// jQuery selector functions -------------------------------------------------------

$(document).ready(function() {
	$('html, body').animate({scrollTop: '0px'}, 0);
	
	$('select#beer_categories').change(function() { updateBeerCategory(); });
	$('select#beer_styles').change(function() { updateBeerStyle(); });
	$('#add_beer_form input').blur(function() { $('html, body').animate({scrollTop: '0px'}, 0); });
	$('#add_beer_form textarea').blur(function() { $('html, body').animate({scrollTop: '0px'}, 0); });
	
	$('#brewery_name').live('keydown',function() {
		myScroll.scrollTo(0, 0, 0);
	});
	
	$('#backButton').live('click',function() {
		$('html, body').animate({scrollTop: '0px'}, 0);
		tabSelect('');
		if (currentPage.id == 'feed_detail') {
			$('#add_comment').addClass('active');
			$('#footer').removeClass('active');
		} else {
			// reset footer
			$('#add_comment').removeClass('active');
			$('#footer').addClass('active');
		}
		
		console.log('currentPage: ' + currentPage.id);
		
		if (currentPage.id == 'index') {
			tabSelect('the_tab');
		}
	});
	// $('#add_comment_text').focus(function() {
	// 	$('#add_comment').animate({
	// 		bottom: 260
	// 	},250);
	// 	$('html, body').animate({scrollTop: '0px'}, 0);
	// });
	
	$(window).scroll(function() {
		if (currentPage.id == 'index') {
			var win = $(window).scrollTop(),
				doc = $('ul#index').height(),
				change = doc-550,
				feed_count = $('ul#index li').length - 3;
				
			console.log('feed_count: ' + feed_count + ', win: ' + win + ', document: ' + doc + ', change: ' + change);
			
			if (win > change && change > -1 && $('ul#index span.results').html() && scroll == 0) {
				//$(window).unbind(scroll);
				loadTab(feed_count);
				scroll = 1;
			}
		}
	});
	
	$('#beer_search').submit(function() {
		findBeer();
		$('#beer_name').blur();
	});
	$('#beer_name').blur(function() {
		if ($(this).val() != '') {
			findBeer();
		}
	});
	$('#friend_search').submit(function() {
		findFriend();
		$('#user_name').blur();
	});
	$('#user_name').blur(function() {
		if ($(this).val() != '') {
			findFriend();
		}
	});
	
	$('#index li.tab_heading ul li').click(function() {
		var type = $(this).attr('id');
		if ($(this).hasClass('active')) {
			loadTab(0);
		} else {
			$('#index li.tab_heading ul li').removeClass('active');
			$(this).addClass('active');
			loadTab(0);
		}
	});
});





// // Camera
// var pictureSource;   // picture source
// var destinationType; // sets the format of returned value 
// 
// 
// // Called when a photo is successfully retrieved
// //
// function onPhotoDataSuccess(imageData) {
//     // Uncomment to view the base64 encoded image data
//     // console.log(imageData);
//     
//     // Get image handle
//     //
//     var smallImage = document.getElementById('smallImage');
//     
//     // Unhide image elements
//     //
//     smallImage.style.display = 'block';
//     
//     // Show the captured photo
//     // The inline CSS rules are used to resize the image
//     //
//     smallImage.src = "data:image/jpeg;base64," + imageData;
// }
// 
// // Called when a photo is successfully retrieved
// //
// function onPhotoURISuccess(imageURI) {
//     // Uncomment to view the image file URI 
//     // console.log(imageURI);
//     
//     // Get image handle
//     //
//     var largeImage = document.getElementById('largeImage');
//     
//     // Unhide image elements
//     //
//     largeImage.style.display = 'block';
//     
//     // Show the captured photo
//     // The inline CSS rules are used to resize the image
//     //
//     largeImage.src = imageURI;
// }
// 
// // A button will call this function
// //
// function capturePhoto() {
//     // Take picture using device camera and retrieve image as base64-encoded string
//     navigator.camera.getPicture(onPhotoDataSuccess, onFail, { quality: 50 });
// }
// 
// // A button will call this function
// //
// function capturePhotoEdit() {
//     // Take picture using device camera, allow edit, and retrieve image as base64-encoded string  
//     navigator.camera.getPicture(onPhotoDataSuccess, onFail, { quality: 20, allowEdit: true }); 
// }
// 
// // A button will call this function
// //
// function getPhoto(source) {
//     // Retrieve image file location from specified source
//     navigator.camera.getPicture(onPhotoURISuccess, onFail, { quality: 50, 
//                                 destinationType: destinationType.FILE_URI,
//                                 sourceType: source });
// }
// 
// // Called if something bad happens.
// // 
// function onFail(message) {
//     alert('Failed because: ' + message);
// }