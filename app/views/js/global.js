var limit = 0;
var date = new Date();
var time = encodeURIComponent(date);
var timeout = 10000;

function load(message,status) {
	$('#load_overlay').remove();
	if (message != undefined) {
		$('body').append('<section id="load_overlay" style="display:block;"><section class="dialogue">' + message + '</section></section>');
	}
	if (status != undefined) {
		setTimeout("$('#load_overlay').remove();",1000);
	}
}

function store() {
	var user_id = $('input#user_id').val();
	var user_name = $('input#user_name').val();
	if (user_name != '' || user_id != '') {
		// localStorage.clear();
		localStorage['user_id'] = user_id;
		localStorage['user_name'] = user_name;
		console.log(localStorage['user_id']);
		console.log(localStorage['user_name']);
		loadTab(0);
		setTimeout('getNotifications()',3000);
	} else {
		logout();
	}
}

function storeCheck() {
	if (localStorage['revision10'] == null) {
		localStorage.clear();
		localStorage['revision10'] = time;
	}
	if (localStorage['user_id'] != null) {
		load('Logging in...');
		var user_name = localStorage['user_name'];
		var user_id = localStorage['user_id'];
		$.ajax({
			cache: false,
			url: '/logged',
			data: { user_name: user_name, user_id: user_id },
			success: function(results) {
						console.log(results);
						if (results.status == 'success') {
							window.location='/dashboard';
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
	$.ajax({
		cache: false,
		url: '/logout',
		success: function(results) {
					if (results.status == 'success') {
						localStorage.clear();
						window.location='/';
					}
				},
		error: function(results) {
					return false;
				}
	});
}

// just a test
function message(message) {
	$('body').append('<section id="overlay" onclick="$(\'#modal\').fadeOut();" style="width:100%; text-align:center; position:absolute; top:0; left:0; display:block; padding-top:75px; background:rgba(0,0,0,0.5);"><section style="background:#ffffff; color:#000000; display:block; width:150px; height:75px; margin:0 auto;">just testing</section><section style="clear:both;"></section></section>');
}

function tabSelect(name) {
	$('#footer ul li').removeClass('active');
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
	
	// resets
	pageHistory = [];
	if (comment == '') {
		$('#add_comment').fadeOut();
		$('#footer').fadeIn();
	}
	
	if (limit == 0) {
		$('html, body').animate({scrollTop: '0px'}, 0);
		$('#index').empty();
	}
	$('.load_more').remove();
	$('#index').append('<li class="loader"><p class="meta">Brewing...</p></li>');
	tabSelect('the_tab');
	
	$.ajax({
		cache: false,
		timeout: timeout,
		url: '/get-feed',
		data: { limit: limit },
		success: function(results) {
					if (results != '') {
						if (limit == 0) {
							$('#index').empty();
						}
						$('li.loader').remove();
						for (var i = 0; i < results.length; i++) {
							
							// RATING ------------------------
							var action = '', list_copy = '';
							if (results[i].rating != '') {
								switch(results[i].rating) {
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
							if (results[i].type == 'LIST') {
								action = 'added';
								list_copy = '<p class="meta" style="margin: -5px 0 5px 43px;">to their To Drink list</p>';
							}
							
							var time = (results[i].time == undefined) ? '' : fixTime(results[i].time);
							
							// COMMENT ------------------------
							var comment = '';
							if (results[i].comment != null) {
								comment = '<blockquote>' + results[i].comment + '</blockquote>';
							}
							
							var comment_count = '';
							if (results[i].comment_count != 0) {
								if (results[i].comment_count > 1) {
									comment_count = '<span class="comment_count right"><span class="icon comment right"></span>' + results[i].comment_count + '</span>';
								} else {
									comment_count = '<span class="comment_count right"><span class="icon comment right"></span>' + results[i].comment_count + '</span>';
								}
							}
							
							var avatar = '<img src="' + results[i].avatar + '" width="32px" class="left avatar" />'
							var item_heading = '<p class="meta">' + results[i].first_name + ' ' + action + '</p>';
							var beer_name = '<h3 id="' + results[i].beer_id + '" class="beer_name">' + results[i].beer_name + '</h3>';
							$('#index').append('<li id="feed-item-' + results[i].id + '" class="feed-item"><a href="javascript:void(0);" onclick="feedDetail(' + results[i].id + ');">'
												+ '<section class="icon arrow right"></section>'
												+ '<span class="info">'
												+ time
												+ comment_count
												+ '</span>'
												+ avatar
												+ item_heading
												+ beer_name
												+ list_copy
												+ comment
												+ '</a></li>');
						}
						
						var obj = $('#index li');
						var feed = $.makeArray(obj);
						
						if (feed.length > 5 && results.length >= 10) {
							limit += 10;
							$('#index').append('<li class="load_more" onclick="loadTab(' + limit + ');">Tap to View More</li>');
						} else {
							$('#index').append('<li class="load_more">end of the line</li>');
						}
					} else {
						$('#index').empty().append('<li class="load_more">Your tab is empty, start by adding a beer and following others!</li>');
					}
				},
		error: function(results) {
					load('Something went wrong!','error');
					return false;
				}
	});
}

function feedDetail(id,notification) {
	load('Brewing...');
	
	if (notification) {
		$('#notifier').removeClass('active');
	}
	
	$.ajax({
		cache: false,
		timeout: timeout,
		url: '/get-comments',
		data: { id: id },
		success: function(results) {
					if (results != '') {
						// to top
						$('html, body').animate({scrollTop: '0px'}, 0);
						
						//removes footer - empties comment
						$('#add_comment').fadeIn();
						$('#add_comment_text').val('');
						$('#footer').fadeOut();
						
						var title = results[0].name;
						var first_name = (results[0].first_name == null) ? '' : results[0].first_name;
						var last_name = (results[0].last_name == null) ? '' : results[0].last_name;
						var user_name = first_name + ' ' + last_name;
						
						// RATING ------------------------
						var action = '', list_copy = '';
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
						
						var time = (results[0].time == undefined) ? '' : fixTime(results[0].time);
						
						// COMMENT ------------------------
						var comment = '';
						if (results[0].comment != null) {
							comment = '<blockquote>' + results[0].comment + '</blockquote>';
						}
						
						var comment_count = '';
						if (results[0].comment_count != 0) {
							if (results[0].comment_count > 1) {
								comment_count = '<span class="comment_count right"><span class="icon comment right"></span>' + results[0].comment_count + '</span>';
							} else {
								comment_count = '<span class="comment_count right"><span class="icon comment right"></span>' + results[0].comment_count + '</span>';
							}
						}
						
						var avatar = '<img src="' + results[0].avatar + '" width="32px" class="left avatar" />';
						var item_heading = '<p class="meta">' + results[0].first_name + ' ' + action + '</p>';
						var beer_name = '<h3 id="' + results[0].beer_id + '" class="beer_name">' + results[0].beer_name + '</h3>';
						var owner_id = (results[0].owner_id == null) ? results[0].user_id : results[0].owner_id;
						$('#add_comment_text').attr('onblur','addComment(' + results[0].beer_id + ',' + results[0].rating + ',' + id + ',' + owner_id + ');');
						
						// sets up feed owner info
						$('ul#feed_detail').attr('title',title);
						$('ul#feed_detail span.results').empty().append('<li>'
											+ '<a href="javascript:void(0);" onclick="beerDetail(' + results[0].beer_id + ');">'
											+ '<section class="icon arrow right"></section>'
											+ '<span class="info">'
											+ time
											+ comment_count
											+ '</span>'
											+ avatar
											+ item_heading
											+ beer_name
											+ list_copy
											+ comment
											+ '<section class="push"></section>'
											+ '</a></li>');
						
						if (results[0].owner_id == results[0].partner_id) {
							if (results[0].comment != undefined) {
								var i = 1;
							}
						} else {
							var i = 0;
						}
						
						// adds additional comments
						for(i; i < results.length; i++) {
						
							var first_name = (results[i].first_name == null) ? '' : results[i].first_name;
							var last_name = (results[i].last_name == null) ? '' : results[i].last_name;
							var user_name = first_name;
							var time = (results[i].time == undefined) ? '' : fixTime(results[i].time);
						
							$('ul#feed_detail span.results').append('<li>'
												+ '<a href="javascript:void(0);" onclick="loadProfile(\'' + results[i].partner_id + '\')">'
												+ '<img src="' + results[i].avatar + '" width="32px" class="avatar left" />'
												+ time
												+ '<p class="meta">' + user_name + '</p>'
												+ '<p class="comment">' + results[i].comment + '</p>'
												+ '</a></li>');
						}
						
						window.location='/dashboard#_feed_detail';
						load();
					}
				},
		error: function(results) {
					load('Something went wrong!','error');
					return false;
				}
	});
}

function loadFindBeer() {
	
	// resets
	pageHistory = [];
	
	tabSelect('find_beer');
	$('#beer_name').val('');
	$('html, body').animate({scrollTop: '0px'}, 0);
}

function loadFindFriend() {
	
	// resets
	pageHistory = [];
	$('#add_comment').fadeOut();
	$('#footer').fadeIn();
	
	$('#user_name').val('');
	$('html, body').animate({scrollTop: '0px'}, 0);
}




// PROFILE FUNCTIONS -------------------------------------------------------

function loadProfile(id,notification) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	load('Brewing...');
	
	// resets
	pageHistory = [];
	$('#add_comment').fadeOut();
	$('#footer').fadeIn();
	
	if (notification) {
		$('#notifier').removeClass('active');
	}
	
	$.ajax({
		cache: false,
		url: '/get-profile',
		data: { user_id: id },
		success: function(results) {
					if (results != '') {
						// Profile heading
						var first_name = (results[0].first_name == null) ? '' : results[0].first_name;
						var last_name = (results[0].last_name == null) ? '' : results[0].last_name;
						var user_name = first_name + ' ' + last_name;
						var user_id = results[0].user_id;
						var activity = (results[0].beer_name == undefined) ? '' : '<p class="meta">Last seen drinking a <b>' + results[0].beer_name + '</b></p>';
						
						if (results[0].user_id != $('#user_id').val()) {
							var follow  = (results[0].created_date == null) ? '<li><a href="javascript:void(0);" onclick="follow(' + id + ');" class="btn orange ' + id + '">Follow</a></li>' : '<li><a href="javascript:void(0);" onclick="unfollow(' + id + ');" class="btn light ' + id + '">Unfollow</a></li>';
							var profile_settings = '';
						} else {
							// My profile
							tabSelect('profile');
							var follow = '';
							var profile_settings = '<li><ul id="profile_meta"><li onclick="loadNotifications();"><span class="icon notifications center"></span></li><li><span class="icon settings center"></span></li></ul></li>';
						}

						$('ul#profile').attr('title',user_name).empty();
						$('ul#profile').append('<li style="height:60px;">'
											+ '<img src="' + results[0].avatar + '" width="48px" class="avatar left" />'
											+ '<h3>' + user_name + '</h3>'
											+ activity
											+ '</ul>'
											+ '</li>'
											+ follow
											+ profile_settings
											+ '<li class="profile_item"><a href="javascript:void(0);" onclick="loadToDrink(' + user_id + ');"><section class="icon arrow right"></section><span>' + results[0].todrink_count + '</span><b>To Drink list</b></a></li>'
											+ '<li class="profile_item"><a href="javascript:void(0);" onclick="loadActivity(' + user_id + ');"><section class="icon arrow right"></section><span>' + results[0].beer_count + '</span><b>Beers</b></a></li>'
											+ '<li class="profile_item"><a href="javascript:void(0);" onclick="loadFollowers(' + user_id + ');"><section class="icon arrow right"></section><span>' + results[0].follower_count + '</span><b>Followers</b></a></li>'
											+ '<li class="profile_item"><a href="javascript:void(0);" onclick="loadFollowing(' + user_id + ');"><section class="icon arrow right"></section><span>' + results[0].following_count + '</span><b>Following</b></a></li>');
						
						window.location='/dashboard#_profile';
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
		url: '/get-to-drink-list',
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
						window.location='/dashboard#_profile_detail';
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
		url: '/get-activity',
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
						window.location='/dashboard#_profile_detail';
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
		url: '/get-followers',
		data: { user_id: user_id },
		success: function(results) {
					if (results != '') {
						$('#profile_detail').empty();
						for(var i = 0; i < results.length; i++) {
							var first_name = (results[i].first_name == null) ? '' : results[i].first_name;
							var last_name = (results[i].last_name == null) ? '' : results[i].last_name;
							var user_id = results[i].user_id;
							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
							var avatar = results[i].avatar;
							$('#profile_detail').attr('title','Followers').append('<li style="height:55px;">'
																+ '<a href="#profile" id="' + user_id + '" onclick="javascript:loadProfile(' + user_id + ');">'
																+ '<section class="icon arrow right"></section>'
							 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
																+ '<h3>' + first_name + ' ' + last_name + '</h3>'
							 									+ '</a></li>');
						}
						window.location='/dashboard#_profile_detail';
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
		url: '/get-following',
		data: { user_id: user_id },
		success: function(results) {
					if (results != '') {
						$('#profile_detail').empty();
						for(var i = 0; i < results.length; i++) {
							var first_name = (results[i].first_name == null) ? '' : results[i].first_name;
							var last_name = (results[i].last_name == null) ? '' : results[i].last_name;
							var user_id = results[i].user_id;
							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
							var avatar = results[i].avatar;
							$('#profile_detail').attr('title','Following').append('<li style="height:55px;">'
																+ '<a href="#profile" id="' + user_id + '" onclick="javascript:loadProfile(' + user_id + ');">'
																+ '<section class="icon arrow right"></section>'
							 									+ '<img src="' + avatar + '" width="32px" class="avatar left" />'
																+ '<h3>' + first_name + ' ' + last_name + '</h3>'
							 									+ '</a></li>');
						}
						window.location='/dashboard#_profile_detail';
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
	$.ajax({
		cache: false,
		url: '/follow',
		data: { owner_id: id },
		success: function(results) {
					if (results != '') {
						$('a.' + id).replaceWith('<a href="javascript:void(0);" onclick="unfollow(' + id + ');" class="btn light ' + id + '">Unfollow</a>');
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
	$.ajax({
		cache: false,
		url: '/unfollow',
		data: { owner_id: id },
		success: function(results) {
					if (results != '') {
						$('a.' + id).replaceWith('<a href="javascript:void(0);" onclick="follow(' + id + ');" class="btn orange ' + id + '">Follow</a>');
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

function beerDetail(id) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	load('Brewing...');
	
	// reset footer
	$('#add_comment').fadeOut();
	$('#footer').fadeIn();
	
	$.ajax({
		cache: false,
		url: '/beer-detail',
		data: { beer_id: id },
		success: function(results) {
					if (results != '') {
						var beer_name = escape(results[0].name);
						var brewery = (results[0].cat_name != '') ? '<p class="stats"><b>Brewery:</b>' + results[0].brewery + '</p>' : '';
						var abv = (results[0].abv > 0) ? '<p class="stats"><b>ABV:</b>' + results[0].abv + '%</p>' : '';
						var category = (results[0].cat_name != '') ? '<p class="stats"><b>Category:</b>' + results[0].cat_name + '</p>' : '';
						var style = (results[0].style_name != '') ? '<p class="stats"><b>Style:</b>' + results[0].style_name + '</p>' : '';
						
						var love = (results[0].love > 0) ? results[0].love : '';
						var like = (results[0].like > 0) ? results[0].like : '';
						var meh = (results[0].meh > 0) ? results[0].meh : '';
						var dislike = (results[0].dislike > 0) ? results[0].dislike : '';
						
						var love_active = '', like_active = '', meh_active = '', dislike_active = '', ed = '', todrink_active = '';
						switch(results[0].rating) {
							case 1:
								love_active = ' active';
								break;
							case 2:
								like_active = ' active';
								break;
							case 3:
								meh_active = ' active';
								break;
							case 4:
								dislike_active = ' active';
								break;
						}
						if (results[0].addtodrink != null) {
							ed = 'ed';
							todrink_active = ' active';
						}
						
						$('#beer_detail').empty().attr('title',unescape(beer_name)).append('<li><ul class="rate_controls ' + id + '">'
															+ '<li onclick="rateBeer(' + id + ',\'love\');" class="love' + love_active + '"><p class="rate_count right">' + love + '</p><span></span></li>'
															+ '<li onclick="rateBeer(' + id + ',\'like\');" class="like' + like_active + '"><p class="rate_count right">' + like + '</p><span></span></li>'
															+ '<li onclick="rateBeer(' + id + ',\'meh\');" class="meh' + meh_active + '"><p class="rate_count right">' + meh + '</p><span></span></li>'
															+ '<li onclick="rateBeer(' + id + ',\'dislike\');" class="dislike' + dislike_active + '"><p class="rate_count right">' + dislike + '</p><span></span></li>'
															+ '</ul></li>'
															+ '<li class="addToDrink ' + id + '' + todrink_active + '" onclick="addToDrink(' + id + ');">Add' + ed + ' to Drink List<span></span></li>'
															+ '<li id="' + id + '">'
															+ brewery
															+ abv
															+ category
															+ style
															+ '</li>'
															+ '<li style="display:none;"><a href="#index" onclick="loadTab();" class="btn orange">Beer Me</a></li>');
						
						// get location
						getLocation();
						
						window.location='/dashboard#_beer_detail';
						load();
					} else {
						load('Something went wrong!','error');
					}
				},
		error: function() {
					return false;
				}
	});
}



// ADD NEW BEER -------------------------------------------------------

function updateBeerCount(id,unrate) {
	var uncount = parseInt($('ul.' + id + ' li.' + unrate + ' p.rate_count').text()) - 1;
	if (uncount <= 0) {
		$('ul.' + id + ' li.' + unrate + ' p.rate_count').empty();
	} else {
		$('ul.' + id + ' li.' + unrate + ' p.rate_count').empty().append(uncount);
	}
}
function getAttributes() {
	load('Brewing...');
	getBreweries();
	getBeerCategories();
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
	window.location='/dashboard#_add_beer';
}
function getBreweries() {
	$.ajax({
		cache: false,
		url: '/get-breweries',
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
function getBeerCategories() {
	load('Brewing...');
	$.ajax({
		cache: false,
		url: '/get-beer-categories',
		success: function(results) {
					console.log(results);
					if (results != '') {
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
		url: '/get-beer-styles',
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
	//now.insertNewBeer(name, brewery, description, abv, category, style);
	$.ajax({
		cache: false,
		url: '/new-beer',
		data: { name: name, brewery: brewery, description: description, abv: abv, category: category, style: style },
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
function showNewBeer(data) {
	load('Beer added successfully!');
	console.log(data);
	if (data != undefined) {
		beerDetail(data);
	}
}



// BEER DETAIL FUNCTIONS -------------------------------------------------------

function addToDrink(id) {
	load('Brewing...');
	if ($('li.' + id).hasClass('active')) {
		removeList = '';
		$('li.' + id).removeClass('active');
	} else {
		removeList = true;
		$('li.' + id).addClass('active');
	}
	$.ajax({
		cache: false,
		url: '/add-to-drink-list',
		data: { beer_id: id, removeList: removeList },
		success: function(results) {
					load();
				},
		error: function(results) {
					return false;
				}
	});
}

function rateBeer(id,rate) {
	load('Brewing...');
	
	var latitude = $('#latitude').val();
	var longitude = $('#longitude').val();
	
	console.log(latitude);
	console.log(longitude);
	
	var unrate = '';
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
	
	if ($('li.addToDrink.' + id).hasClass('active')) {
		addToDrink(id);
	}
	
	$.ajax({
		cahce: false,
		url: '/beer-checkin',
		data: { beer_id: id, rate: rate, unrate: unrate, latitude: latitude, longitude: longitude },
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
						$('#share li.share_button').empty().append('<a href="javascript:void(0);" onclick="share(' + id + ',' + results.rate + ',' + results.feed_id + ');" class="btn orange">Bottom\'s Up</a>')
						$('#share textarea.comment').val('');
						
						window.location='/dashboard#_share';
					} else {
						load('Something went wrong!','error');
					}
				},
		error: function(results) {
					return false;
				}
	});
}

function share(beer_id,rate,feed_id) {
	load('Brewing...');
	var comment = $('#share textarea.comment').val();

	if (comment == '') {
		window.location='/dashboard#_index';
		loadTab(0);
		load('Success!','success');
	} else {
		$.ajax({
			cache: false,
			url: '/share-beer',
			data: { feed_id: feed_id, beer_id: beer_id, rating: rate, comment: comment },
			success: function(results) {
						if (results.status == 'success') {
							window.location='/dashboard#_index';
							loadTab(0);
							load('Success!','success');
						} else {
							load('Something went wrong!','error');
						}
					},
			error: function(results) {
						return false;
					}
		});
	}
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
			url: '/add-comment',
			data: { beer_id: beer_id, rating: rate, feed_id: feed_id, comment: comment, owner_id: owner_id },
			success: function(results) {
						if (results != '') {
							
							var first_name = (results[0].first_name == null) ? '' : results[0].first_name;
							var last_name = (results[0].last_name == null) ? '' : results[0].last_name;
							var user_name = first_name + ' ' + last_name;
							
							load('Comment added!','success');
							$('#add_comment_text').val('');
							$('ul#feed_detail span.results').append('<li>'
												+ '<a href="javascript:void(0);" onclick="loadProfile(\'' + results[0].user_id + '\')">'
												+ '<img src="' + results[0].avatar + '" width="32px" class="avatar left" />'
												+ '<time class="right">just now</time>'
												+ '<p class="meta">' + user_name + '</p>'
												+ '<p class="comment">' + comment + '</p>'
												+ '</a></li>');
							loadTab(0,'comment');
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



// SEARCH FUNCTIONS -------------------------------------------------------

function findBeer() {
	
	var name = $.trim($('input#beer_name').val());
	$('#find_beer span.results').empty().append('<li class="loader"><p class="meta">Brewing...</p></li>');
	
	if (name != '' && name.length > 1) {
		$.ajax({
			cache: false,
			url: '/find-beer',
			data: { beer_name: name },
			dataType: 'json',
			success: function(results) {
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
								$('ul#find_beer span.results').append('<li><a href="javascript:void(0);" onclick="getAttributes();" class="ac btn orange">Add new beer</a></li>');
							} else {
								$('ul#find_beer span.results').append('<li><a href="javascript:void(0);" onclick="getAttributes();" class="ac btn orange">Add new beer</a></li>');
							}
						} else {
							$('ul#find_beer span.results').empty().append('<li><a href="javascript:void(0);" onclick="getAttributes();" class="ac btn orange">Add new beer</a></li>');
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
			url: '/find-friend',
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
																	+ '<a href="#profile" id="' + user_id + '" onclick="javascript:loadProfile(' + user_id + ');">'
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



// NOTIFICATIONS -------------------------------------------------------

function getNotifications() {
	var user_id = $('input#user_id').val();
	var user_name = $('input#user_name').val();
	if (user_name != '' || user_id != '') {
		$.ajax({
			cache: false,
			url: '/get-notifications',
			success: function(results) {
						var message = '';
						if (results != '') {
							if (results.length > 1) {
								$('#notifier').empty().append('<a href="javascript:void(0);" onclick="loadNotifications();">You have ' + results.length + ' new notifications!</a>').addClass('active');
							} else {
								switch(results[0].type) {
									case 'COMMENT':
										message = '<a href="javascript:void(0);" onclick="feedDetail(' + results[0].feed_id + ',true);">You have a new comment!</a>';
										break;
									case 'FOLLOW':
										message = '<a href="javascript:void(0);" onclick="loadProfile(' + results[0].partner_id + ',true);">You have a new follower!</a>';
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
	$.ajax({
		cache: false,
		url: '/get-notifications-list',
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
							}
							$('#profile_detail').append('<li style="height:45px;"' + unread + '>' + message + '</li>');
						}
						window.location='/dashboard#_profile_detail';
						
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


// Location functions -------------------------------------------------------
 
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

// jQuery selector functions -------------------------------------------------------

$(document).ready(function() {
	$('html, body').animate({scrollTop: '0px'}, 0);
	
	$('select#beer_categories').change(function() { updateBeerCategory(); });
	$('select#beer_styles').change(function() { updateBeerStyle(); });
	$('#add_beer_form input').blur(function() { $('html, body').animate({scrollTop: '0px'}, 0); });
	$('#add_beer_form textarea').blur(function() { $('html, body').animate({scrollTop: '0px'}, 0); });
	
	$('#backButton').live('click',function() {
		$('html, body').animate({scrollTop: '0px'}, 0);
		tabSelect('');
		if (currentPage.id == 'feed_detail') {
			$('#add_comment').fadeIn();
			$('#footer').fadeOut();
		} else {
			// reset footer
			$('#add_comment').fadeOut();
			$('#footer').fadeIn();
		}
	});
	// $('#add_comment_text').focus(function() {
	// 	$('#add_comment').animate({
	// 		bottom: 260
	// 	},250);
	// 	$('html, body').animate({scrollTop: '0px'}, 0);
	// });
	
	$('#beer_search').submit(function() {
		findBeer();
		$('#beer_name').blur();
	});
	
	$('#friend_search').submit(function() {
		findFriend();
		$('#user_name').blur();
	});
	
	// infinite scroll
	// $(window).scroll(function(){
	// 	var w = $(document).height() - $(window).height();
	// 	// var ww = w-300;
	// 	// Used to check the values:
	// 	// $('body').append('<div style="position:fixed; bottom: 250px; left: 5px; z-index:9999;;">'
	// 	//					  + '<input type="text" value="Window-50: ' + ww + '" />'
	// 	//					  + '<input type="text" value="Window Scroll: ' + $(window).scrollTop() + '" />');
	// 	if ($(window).scrollTop() >= w){
	// 		loadTab(limit);
	// 		limit += 10;
	// 	}
	// });
	
	// $('input#beer_name').live('keyup', function() {
	// 		findBeer();
	// 	});
	// 	$('input#user_name').live('keyup', function() {
	// 		findFriend();
	// 	});
});