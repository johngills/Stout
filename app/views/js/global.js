var limit = 0;
var time = new Date();

function store() {
	var user_id = $('input#user_id').val();
	var user_name = $('input#user_name').val();
	if ((user_id != undefined && user_name != undefined) || (user_id != '' && user_name != '')) {
		localStorage.clear();
		localStorage['user_id'] = user_id;
		localStorage['user_name'] = user_name;
	}
}

function storeCheck() {
	if (localStorage['revision1'] == null) {
		localStorage.clear();
		localStorage['revision1'] = time;
	}
	if (localStorage['user_id'] != null) {
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
						}
					},
			error: function(results) {
						console.log(results);
						return false;
					}
		});
	} else {
		localStorage.clear();
		return false;
	}
}

function test() {
	$.ajax({
		cache: false,
		url: 'https://api.twitter.com/1/users/show.json',
		data: { screen_name: 'marloyearight', user_id: '25537168' },
		dataType: 'jsonp',
		success: function(results) {
					console.log(results);
				}
	});
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

function message(message) {
	$('body').append('<section id="overlay" onclick="$(\'#modal\').fadeOut();" style="width:100%; text-align:center; position:absolute; top:0; left:0; display:block; padding-top:75px; background:rgba(0,0,0,0.5);"><section style="background:#ffffff; color:#000000; display:block; width:150px; height:75px; margin:0 auto;">just testing</section><section style="clear:both;"></section></section>');
}

function tabSelect(name) {
	$('#footer ul li').removeClass('active');
	if (name != '') {
		$('#footer ul li.' + name).addClass('active');
	}
}

function loadTab(limit) {	
	if (limit == 0) {
		$('html, body').animate({scrollTop: '0px'}, 0);
		$('#index').empty();
	}
	$('.load_more').remove();
	$('#index').append('<li class="loader">Loading your tab...</li>');
	tabSelect('the_tab');
	
	$.ajax({
		cache: false,
		url: '/get-feed',
		data: { limit: limit },
		success: function(results) {
					if (results != '') {
						if (limit == 0) {
							$('#index').empty();
						}
						$('li.loader').remove();
						for (var i = 0; i < results.length; i++) {
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
										action = 'is meh for';
										break;
									case 4:
										action = 'dislikes';
										break;
								}
							}
							var time = '';
							if (results[i].time == 0) {
								time = '<time class="right">just now</time>'; // seconds ago
							} else if (results[i].time > 0 && results[i].time < 60) {
								time = '<time class="right">' + results[i].time + 'm</time>'; // minutes ago
							} else if (results[i].time > 59 && results[i].time < 1440) {
								time = '<time class="right">' + Math.round(results[i].time/60) + 'h</time>'; // hours ago
							} else if (results[i].time > 1439 && results[i].time < 10080) {
								time = '<time class="right">' + Math.round(results[i].time/1440) + 'd</time>'; // days ago
							} else if (results[i].time > 10079 && results[i].time < 30240) {
								time = '<time class="right">' + Math.round(results[i].time/10080) + 'w</time>'; // weeks ago
							}
							var avatar = '<img src="' + results[i].avatar + '" width="32px" class="left avatar" />'
							var item_heading = '<p class="meta">' + results[i].first_name + ' ' + action + '</p>';
							var beer_name = '<h3>' + results[i].beer_name + '</h3>';
							$('#index').append('<li><a href="#profile" onclick="loadProfile(' + results[i].user_id + ')">'
												+ '<section class="icon arrow right"></section>'
												+ time
												+ avatar
												+ item_heading
												+ beer_name
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
						$('#index').empty().append('<li class="loader">Your tab is empty, start by adding a beer and following others!</li>');
					}
				},
		error: function(results) {
					$('#index').empty().append('<li class="loader">There was a problem loading your tab!</li>');
					return false;
				}
	});
}

function loadFindBeer() {
	tabSelect('find_beer');
	$('#beer_name').val('');
	$('html, body').animate({scrollTop: '0px'}, 0);
}

function loadFindFriend() {
	$('#user_name').val('');
	$('html, body').animate({scrollTop: '0px'}, 0);
}

function loadProfile(id) {
	$('html, body').animate({scrollTop: '0px'}, 0);
	$.ajax({
		cache: false,
		url: '/get-profile',
		data: { user_id: id },
		success: function(results) {
					if (results != '') {
						// Profile heading
						var user_name = results[0].first_name + ' ' + results[0].last_name;
						if (results[0].user_id != $('#user_id').val()) {
							var follow  = (results[0].created_date == null) ? '<li><a href="javascript:void(0);" onclick="follow(' + id + ');" class="btn orange ' + id + '">Follow</a></li>' : '<li><a href="javascript:void(0);" onclick="unfollow(' + id + ');" class="btn light ' + id + '">Unfollow</a></li>';
							var profile_settings = '';
						} else { // My profile
							tabSelect('profile');
							var follow = '';
							var profile_settings = '<li><a href="mailto:me@mynameissterling.com" class="btn orange">Feedback</a><a href="javascript:void(0);" onclick="logout();" class="btn orange">Logout</a><p class="meta ac">Made with love by MyNIS Labs</p><br /><br /><br /></li>'
						}
						$('ul#profile').attr('title',user_name).empty();
						$('ul#profile').append('<li style="height:80px;">'
											+ '<img src="' + results[0].avatar + '" width="48px" class="avatar left" />'
											+ '<h3>' + user_name + '</h3>'
											+ '<p class="meta">Last seen drinking a <b>' + results[0].beer_name + '</b></p>'
											+ '</li>'
											+ follow
											+ '<li class="heading">Activity</li>');

						// Activity stream
						if (results[0].beer_name != null) {
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
											action = 'is whatever about';
											break;
										case 4:
											action = 'dislikes';
											break;
									}
								}
								var item_heading = '<p class="meta">' + results[i].first_name + ' ' + action + '</p>';
								var beer_name = '<h3>' + results[i].beer_name + '</h3>';
								$('#profile').append('<li>'
													+ '<a href="#beer_detail" onclick="beerDetail(\'' + results[i].beer_id + '\')">'
													+ '<section class="icon arrow right"></section>'
													+ item_heading
													+ beer_name
													+ '</a></li>');
							}
							$('#profile').append(profile_settings);
						}
						if (results.length > 5) {
							$('#profile').append('<li style="height:40px;"></li>');
						}
					}
				},
		error: function(results) {
					return false;
				}
	});
}

function follow(id) {
	$.ajax({
		cache: false,
		url: '/follow',
		data: { owner_id: id },
		success: function(results) {
					if (results != '') {
						$('a.' + id).replaceWith('<a href="javascript:void(0);" onclick="unfollow(' + id + ');" class="btn light ' + id + '">Unfollow</a>');
					} else {
						console.log('There was an error!');
					}
				},
		error: function(results) {
					return false;
				}
	});
}

function unfollow(id) {
	$.ajax({
		cache: false,
		url: '/unfollow',
		data: { owner_id: id },
		success: function(results) {
					if (results != '') {
						$('a.' + id).replaceWith('<a href="javascript:void(0);" onclick="follow(' + id + ');" class="btn orange ' + id + '">Follow</a>');
					} else {
						console.log('There was an error!');
					}
				},
		error: function(results) {
					return false;
				}
	});
}

function beerDetail(id) {
	$.ajax({
		cache: false,
		url: '/beer-detail',
		data: { beer_id: id },
		success: function(results) {
					if (results != '') {
						var beer_name = escape(results[0].name);
						var abv = (results[0].abv > 0) ? '<tr><th>ABV:</th><td>' + results[0].abv + '%</td></tr>' : '';
						var category = (results[0].cat_name != '') ? '<tr><th>Category:</th><td><p>' + results[0].cat_name + '</p></td></tr>' : '';
						var style = (results[0].style_name != '') ? '<tr><th>Style:</th><td><p>' + results[0].style_name + '</p></td></tr>' : '';
						
						var love = (results[0].love > 0) ? results[0].love : '';
						var like = (results[0].like > 0) ? results[0].like : '';
						var meh = (results[0].meh > 0) ? results[0].meh : '';
						var dislike = (results[0].dislike > 0) ? results[0].dislike : '';
						
						var love_active = '', like_active = '', meh_active = '', dislike_active = '';
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
						
						$('#beer_detail').empty().attr('title',unescape(beer_name)).append('<li><ul class="rate_controls ' + id + '">'
															+ '<li onclick="rateBeer(' + id + ',\'love\');" class="love' + love_active + '"><p class="rate_count right">' + love + '</p><span></span></li>'
															+ '<li onclick="rateBeer(' + id + ',\'like\');" class="like' + like_active + '"><p class="rate_count right">' + like + '</p><span></span></li>'
															+ '<li onclick="rateBeer(' + id + ',\'meh\');" class="meh' + meh_active + '"><p class="rate_count right">' + meh + '</p><span></span></li>'
															+ '<li onclick="rateBeer(' + id + ',\'dislike\');" class="dislike' + dislike_active + '"><p class="rate_count right">' + dislike + '</p><span></span></li>'
															+ '</ul></li>'
															+ '<li id="' + id + '"><table class="stats">'
															+ abv
															+ category
															+ style
															+ '</table></li>'
															+ '<li style="display:none;"><a href="#index" onclick="loadTab();" class="btn orange">Beer Me</a></li>');
					}
				},
		error: function() {
					return false;
				}
	});
	// var copy = $('ul#find_beer a#' + id).html();
}

function updateBeerCount(id,unrate) {
	var uncount = parseInt($('ul.' + id + ' li.' + unrate + ' p.rate_count').text()) - 1;
	if (uncount < 0) {
		$('ul.' + id + ' li.' + unrate + ' p.rate_count').empty();
	} else {
		$('ul.' + id + ' li.' + unrate + ' p.rate_count').empty().append(uncount);
	}
}

function rateBeer(id,rate) {
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
	
	$.ajax({
		cahce: false,
		url: '/beer-checkin',
		data: { beer_id: id, rate: rate, unrate: unrate },
		dataType: 'json',
		success: function(results) {
					if (results.status == 'success') {
						var rate_count = $('ul.' + id + ' li.' + rate + ' p.rate_count');
						$('ul.' + id + ' li.' + rate).addClass('active');
						var count = parseInt(rate_count.text());
						if (rate_count.is(':empty')) {
							rate_count.append('1');
						} else {
							rate_count.empty().append(count + 1);
						}
					} else {
						alert('There was an error!');
					}
				},
		error: function(results) {
					return false;
				}
	});
}

function findBeer() {
	
	var name = $.trim($('input#beer_name').val());
	$('#find_beer span.results').empty().append('<li class="loader"><p class="meta">Brewing your search...</p></li>');
	
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
																	+ '<a href="#beer_detail" id="' + id + '" onclick="javascript:beerDetail(' + id + ');">'
																	+ '<section class="icon arrow right"></section>'
								 									+ beer_name
																	+ brewery
								 									+ '</a></li>');
							}
							if (results.length < 5) {
								$('ul#find_beer span.results').append('<li><a href="#add_beer" class="ac btn orange" style="display:none;">Add new beer</a></li>');
							} else {
								$('ul#find_beer span.results').append('<li><a href="#add_beer" class="ac btn orange" style="display:none;">Add new beer</a></li><li style="height:40px;"></li>');
							}
						} else {
							$('ul#find_beer span.results').empty().append('<li><a href="#add_beer" class="ac btn orange" style="display:none;">Add new beer</a></li>');
						}
					},
			error: function(results) {
						$('#find_beer span.results').empty().append('<li>There was a problem loading your tab!</li>');
						return false;
					}
		});
	}
}

function findFriend() {
	
	var name = $.trim($('input#search_user').val());
	$('#find_friend span.results').empty().append('<li class="loader"><p class="meta">Brewing your search...</p></li>');
	
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
								var first_name = results[i].first_name;
								var last_name = results[i].last_name;
								var user_id = results[i].user_id;
								var beer_name = '<h3>' + results[i].beer_name + '</h3>';
								var avatar = '<p class="meta">' + results[i].avatar + '</p>';
								$('ul#find_friend span.results').append('<li>'
																	+ '<a href="#profile" id="' + user_id + '" onclick="javascript:loadProfile(' + user_id + ');">'
																	+ '<section class="icon arrow right"></section>'
								 									+ '<img src="' + results[0].avatar + '" width="32px" class="avatar left" />'
																	+ '<h3>' + first_name + ' ' + last_name + '</h3>'
																	+ '<p class="meta">Last seen drinking a <b>' + results[0].beer_name + '</b></p>'
								 									+ '</a></li>');
							}
						} else {
							$('ul#find_friend span.results').empty().append('<li class="loader"><p class="meta">No one by that name, try searching for another drinking buddy</p></li>');
						}
					},
			error: function(results) {
						$('#find_friend span.results').empty().append('<li>There was a problem loading your tab!</li>');
						return false;
					}
		});
	}
}

$(document).ready(function() {
	$('html, body').animate({scrollTop: '0px'}, 0);
	$(function() {
		if ($('#index[title="The Tab"]').is(':visible') && $('#user_id').val() != '') {
			loadTab(0);
		}
	});
	
	$('#backButton').live('click',function() {
		tabSelect('');
	});
	
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