function checkAuth(a,b,c){if(a.session.user_name==undefined){delete a.session.user_name;delete a.session.user_id;console.log("attempted to redirect to index...");b.redirect("/")}else c()}function hasNumbers(a){var b=/\d/g;return b.test(a)}function dateToString(a){return a&&a.getFullYear()?a.getFullYear()+"-"+(a.getMonth()+1)+"-"+a.getDate()+" "+a.getHours()+"-"+a.getMinutes()+"-"+a.getSeconds():""}var express=require("express"),static=require("node-static"),jade=require("jade"),OAuth=require("oauth").OAuth,url=require("url"),fs=require("fs"),http=require("http"),$=require("jquery"),request=require("request"),crypto=require("crypto"),base64=require("base64"),less=require("less"),parser=new less.Parser({paths:[".","./views/css"],filename:"style.less"});parser.parse(".class { width: 1 + 1 }",function(a,b){b.toCSS({compress:!0})});var app=express.createServer(express.static(__dirname+"/views"),express.cookieParser(),express.session({secret:"FlurbleGurgleBurgle",store:new express.session.MemoryStore({reapInterval:-1})}));app.listen(80);process.on("uncaughtException",function(a){console.log("Caught exception: "+a.stack)});app.use(express.compiler({src:__dirname+"/views",enable:["less"]}));app.use("/css",express.static(__dirname+"/views"));app.set("views",__dirname+"/views");app.set("view engine","jade");app.enable("jsonp callback");var mysql=require("mysql"),database="stout",user_table="users",client=mysql.createClient({user:"sterlingrules",password:"@y&7~s45",host:"mysql.mynameissterling.com",port:3306});client.query("USE "+database);client.database="stout";var oa=new OAuth("https://api.twitter.com/oauth/request_token","https://api.twitter.com/oauth/access_token","Nmqm7UthsfdjaDQ4HcxPw","PIFvIPSXlTIbqnnnjBIqoWs0VIxpQivNrIJuWxtkLI","1.0","http://stoutapp.com/auth/twitter/callback","HMAC-SHA1");app.get("/",function(a,b){console.log(a.session.user_name);console.log(a.session.user_id);if(a.session.user_name==undefined){console.log("got here");b.render("index",{layout:"home",user_name:"",user_id:"",title:"Stout"})}else b.redirect("/dashboard")});app.get("/logged",function(a,b){console.log("req.query.user_name: "+a.query.user_name);if(a.query.user_name==undefined)return!1;a.session.user_name=a.query.user_name;a.session.user_id=a.query.user_id;console.log("req.session.user_name: "+a.session.user_name);console.log("req.session.user_id: "+a.session.user_id);b.json({status:"success"})});app.get("/logout",function(a,b){delete a.session.user_name;delete a.session.user_id;b.json({status:"success"})});app.get("/dashboard",checkAuth,function(a,b){console.log(a.session.user_name);console.log(a.session.user_id);if(a.session.user_name!=undefined||a.session.user_name!=null)b.render("dashboard",{user_name:a.session.user_name,user_id:a.session.user_id,title:"Dashboard | Stout"});else{delete a.session.user_name;delete a.session.user_id;b.redirect("/logout")}});app.get("/get-feed",checkAuth,function(a,b){var c=new Date,d=dateToString(c);client.query('SELECT DISTINCT feed.id, feed.user_name, feed.user_id, feed.beer_id, feed.rating, feed.comment_count, feed.type, ROUND(TIMESTAMPDIFF(SECOND,feed.created_date,"'+d+'")/60) AS time, users.first_name, users.last_name, users.avatar, beers.name AS beer_name, comment '+"FROM feed, beers, users, followers "+"WHERE ((feed.user_id = users.user_id) AND (feed.beer_id = beers.id)) AND (((followers.owner_id = feed.user_id) AND (followers.follower_id = "+a.session.user_id+")) "+"OR ((feed.user_id = "+a.session.user_id+"))) "+"ORDER BY feed.created_date DESC LIMIT "+a.query.limit+",10 ",function(a,c,d){if(a)throw a;if(c!=undefined){console.log(c);b.send(c)}})});app.get("/get-comments",checkAuth,function(a,b){var c=new Date,d=dateToString(c);console.log(a.query.id);client.query('SELECT DISTINCT feed.type, comments.owner_id, comments.partner_id, comments.rating, comments.beer_id AS beer_id, beers.name AS beer_name, beers.description, comments.comment, comments.created_date, comment_number.comment_count, ROUND(TIMESTAMPDIFF(SECOND,comments.created_date,"'+d+'")/60) AS time, owner.avatar AS owner_avatar, owner.first_name AS owner_first_name, owner.last_name AS owner_last_name, partner.avatar AS partner_avatar, partner.first_name AS partner_first_name, partner.last_name AS partner_last_name '+"FROM users AS owner, users AS partner, beers, feed, comments, "+"(SELECT COUNT(comments.comment) AS comment_count FROM comments WHERE comments.feed_id = "+a.query.id+") AS comment_number "+"WHERE comments.feed_id = "+a.query.id+" AND feed.id = "+a.query.id+" AND comments.partner_id = partner.user_id AND comments.owner_id = owner.user_id AND comments.beer_id = beers.id ORDER BY comments.created_date",function(c,e,f){if(c)throw c;console.log(e);e==""?client.query('SELECT feed.user_id, feed.beer_id AS beer_id, feed.rating, feed.type, feed.comment, feed.comment_count, beers.name AS beer_name, beers.description, users.first_name AS owner_first_name, users.last_name AS owner_last_name, users.avatar AS owner_avatar, ROUND(TIMESTAMPDIFF(SECOND,feed.created_date,"'+d+'")/60) AS time, feed.created_date '+"FROM feed, beers, users WHERE feed.id = "+a.query.id+" AND feed.beer_id = beers.id AND feed.user_id = users.user_id",function(a,c,d){if(a)throw a;console.log(c);b.send(c)}):b.send(e);client.query("UPDATE notifications SET notifications.read = 1 WHERE feed_id = "+a.query.id+' AND (type = "COMMENT" OR type = "RATE" OR type = "LIST");',function(a,b,c){if(a)throw a;console.log(b)})})});app.get("/find-beer",checkAuth,function(a,b){console.log("search term: "+a.query.beer_name);client.query('SELECT beers.name, breweries.name AS brewery, beers.id, brewery_id, beers.description FROM beers, breweries WHERE (beers.brewery_id = breweries.id) AND beers.name LIKE "%'+a.query.beer_name+'%" LIMIT 0,10;',function(a,c,d){if(a)throw a;if(c!=undefined){console.log(c);b.send(c)}})});app.get("/beer-detail",checkAuth,function(a,b){client.query("SELECT beers.name, beers.description, beers.abv, beers.love, beers.like, beers.meh, beers.dislike, beers.last_mod, breweries.name AS brewery, categories.cat_name, styles.style_name, feed.rating, todrink.id AS addtodrink FROM beers, breweries, categories, styles LEFT OUTER JOIN todrink ON (todrink.user_id = "+a.session.user_id+" AND todrink.beer_id = "+a.query.beer_id+") "+"LEFT OUTER JOIN feed ON (feed.user_id = "+a.session.user_id+" AND feed.beer_id = "+a.query.beer_id+") "+"WHERE (beers.id = "+a.query.beer_id+") AND (beers.brewery_id = breweries.id) AND (beers.cat_id = categories.id) AND (beers.style_id = styles.id) "+"ORDER BY beers.last_mod DESC",function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/get-breweries",checkAuth,function(a,b){client.query("SELECT name, id AS value FROM breweries",function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/get-beer-categories",checkAuth,function(a,b){client.query("SELECT * FROM categories",function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/get-beer-styles",checkAuth,function(a,b){client.query("SELECT * FROM styles WHERE cat_id = "+a.query.cat_id,function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/new-beer",checkAuth,function(a,b){var c=a.query.name,d=a.query.brewery,e=a.query.description,f=a.query.category,g=a.query.style,h=a.query.abv,i=new Date,j=dateToString(i);if(!hasNumbers(a.query.brewery)){console.log(a.query.brewery);client.query("INSERT INTO breweries SET name = ?, last_mod = ?",[a.query.brewery,j],function(i,k,l){if(i)throw i;console.log(k);d=k.insertId;client.query("INSERT INTO beers SET name = ?, brewery_id = ?, description = ?, cat_id = ?, style_id = ?, abv = ?, last_mod = ?, creator_id = ?, creator_name = ?",[c,d,e,f,g,h,j,a.session.user_id,a.session.user_name],function(a,c,d){if(a)throw a;console.log(c.insertId);b.json({status:"success",id:c.insertId})})})}else client.query("INSERT INTO beers SET name = ?, brewery_id = ?, description = ?, cat_id = ?, style_id = ?, abv = ?, last_mod = ?",[c,d,e,f,g,h,j],function(a,c,d){if(a)throw a;console.log(c);b.json({status:"success",id:c.insertId})})});app.get("/beer-checkin",checkAuth,function(a,b){var c=new Date,d=dateToString(c);console.log("beerid: "+a.query.beer_id);var e="";if(a.query.unrate!=""){var e=", beers."+a.query.unrate+" = beers."+a.query.unrate+" - 1";client.query("DELETE FROM feed WHERE (feed.user_id = "+a.session.user_id+") AND (feed.beer_id = "+a.query.beer_id+")")}client.query("UPDATE beers SET beers."+a.query.rate+" = beers."+a.query.rate+" + 1"+e+', last_mod = "'+d+'" WHERE id = '+a.query.beer_id+";",function(c,e,f){if(c)throw c;if(e!=undefined){console.log(e);var g="";switch(a.query.rate){case"love":g=1;break;case"like":g=2;break;case"meh":g=3;break;case"dislike":g=4}client.query("INSERT INTO feed SET user_id = ?, user_name = ?, beer_id = ?, type = ?, rating = ?, latitude = ?, longitude = ?, created_date = ? ",[a.session.user_id,a.session.user_name,a.query.beer_id,"RATE",g,a.query.latitude,a.query.longitude,d],function(c,e,f){if(c)throw c;console.log(e);b.json({status:"success",feed_id:e.insertId,beer_id:a.query.beer_id,rate:g});a.query.partner_id!=a.session.user_id&&client.query("INSERT INTO notifications SET owner_id = ?, partner_id = ?, type = ?, feed_id = ?, created_date = ?",[a.query.partner_id,a.session.user_id,"RATE",e.insertId,d],function(a,b,c){if(a)throw a})})}else b.json({status:"failure"})})});app.get("/add-to-drink-list",checkAuth,function(a,b){var c=new Date,d=dateToString(c);if(!a.query.removeList){console.log(a.query.removeList);client.query("DELETE FROM todrink WHERE beer_id = "+a.query.beer_id+" AND user_id = "+a.session.user_id,function(c,d,e){if(c)throw c;console.log(d);client.query("DELETE FROM feed WHERE beer_id = "+a.query.beer_id+" AND user_id = "+a.session.user_id+' AND type = "LIST"',function(c,d,e){if(c)throw c;console.log(d);b.json({status:"success"});client.query("DELETE FROM notifications WHERE beer_id = "+a.query.beer_id+" AND partner_id = "+a.session.user_id+' AND type = "LIST";',function(a,b,c){if(a)throw a})})})}else{console.log(a.query.removeList);client.query("INSERT INTO todrink SET beer_id = ?, user_id = ?, user_name = ?, created_date = ?",[a.query.beer_id,a.session.user_id,a.session.user_name,d],function(c,e,f){if(c)throw c;console.log(e);client.query("INSERT INTO feed SET user_id = ?, user_name = ?, beer_id = ?, type = ?, created_date = ? ",[a.session.user_id,a.session.user_name,a.query.beer_id,"LIST",d],function(c,e,f){if(c)throw c;console.log(e);b.json({status:"success"});a.query.partner_id!=a.session.user_id&&client.query("INSERT INTO notifications SET owner_id = ?, partner_id = ?, type = ?, feed_id = ?, beer_id = ?, created_date = ?",[a.query.partner_id,a.session.user_id,"LIST",e.insertId,a.query.beer_id,d],function(a,b,c){if(a)throw a})})})}});app.get("/share-beer",checkAuth,function(a,b){var c=new Date,d=dateToString(c);client.query("INSERT INTO comments SET feed_id = ?, owner_id = ?, partner_id = ?, beer_id = ?, rating = ?, comment = ?, created_date = ?",[a.query.feed_id,a.session.user_id,a.session.user_id,a.query.beer_id,a.query.rating,a.query.comment,d],function(c,d,e){if(c)throw c;console.log(d);client.query('UPDATE feed SET comment = "'+a.query.comment+'", comment_count = 1 WHERE feed.id = '+a.query.feed_id+";",function(a,c,d){if(a)throw a;b.json({status:"success"})})});a.query.send_tweet&&client.query("SELECT access_token, access_token_secret, name AS beer_name FROM users, beers WHERE beers.id = "+a.query.beer_id+" AND user_id = "+a.session.user_id,function(b,c,d){if(b)throw b;console.log(c);var e="";console.log(a.query.rating);switch(a.query.rating){case"1":e="I'm loving this "+c[0].beer_name+" - ";break;case"2":e="Just liked a "+c[0].beer_name+" - ";break;case"3":e="This "+c[0].beer_name+" is meh - ";break;case"4":e="This "+c[0].beer_name+" is gross - "}var f=e+a.query.comment,g=f.substring(0,90);console.log(g+" - http://www.stoutapp.com/detail/"+a.query.feed_id+" (via @StoutApp)");oa.post("http://api.twitter.com/1/statuses/update.json",c[0].access_token,c[0].access_token_secret,{status:g+" (via @StoutApp)"},function(a,b){a?console.log(require("sys").inspect(a)):console.log(b)})})});app.get("/add-comment",checkAuth,function(a,b){var c=new Date,d=dateToString(c);client.query("INSERT INTO comments SET feed_id = ?, owner_id = ?, partner_id = ?, beer_id = ?, rating = ?, comment = ?, created_date = ?",[a.query.feed_id,a.query.owner_id,a.session.user_id,a.query.beer_id,a.query.rating,a.query.comment,d],function(c,e,f){if(c)throw c;console.log(e);client.query("UPDATE feed SET feed.comment_count = feed.comment_count + 1 WHERE feed.id = "+a.query.feed_id,function(c,e,f){if(c)throw c;console.log(e);a.query.owner_id!=a.session.user_id&&client.query("INSERT INTO notifications SET owner_id = ?, partner_id = ?, type = ?, feed_id = ?, created_date = ?",[a.query.owner_id,a.session.user_id,"COMMENT",a.query.feed_id,d],function(a,b,c){if(a)throw a});client.query("SELECT users.user_id, users.first_name, users.last_name, users.avatar FROM users WHERE users.user_id = "+a.session.user_id+";",function(a,c,d){console.log(c);b.send(c)})})})});app.get("/find-friend",checkAuth,function(a,b){console.log("search term: "+a.query.user_name);client.query('SELECT DISTINCT users.user_name, users.first_name, users.last_name, users.user_id, users.avatar FROM users WHERE users.user_name LIKE "%'+a.query.user_name+'%" OR users.full_name LIKE "%'+a.query.user_name+'%" ORDER BY users.created_date DESC LIMIT 0,10;',function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/send-twitter-invite",checkAuth,function(a,b){var c=$.makeArray();c[0]="@"+a.query.screen_name+" Check out what beer I'm drinking on #Stout - http://www.stoutapp.com/";c[1]="@"+a.query.screen_name+" Have a beer with me on #Stout - http://www.stoutapp.com/";var d=Math.floor(2*Math.random());client.query("SELECT access_token, access_token_secret FROM users WHERE user_id = "+a.session.user_id,function(a,e,f){if(a)throw a;console.log(e);oa.post("http://api.twitter.com/1/statuses/update.json",e[0].access_token,e[0].access_token_secret,{status:c[d]},function(a,c){a?console.log(require("sys").inspect(a)):console.log(c);b.json({status:"success"})})})});app.get("/get-profile",checkAuth,function(a,b){var c=a.query.user_id;console.log("profile for user id: "+c);client.query("SELECT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name, beer_number.beer_count, follows.follower_count, following.following_count, todrink_number.todrink_count, followers.created_date FROM users, feed, beers, (SELECT COUNT(todrink.user_id) AS todrink_count FROM todrink WHERE todrink.user_id = "+a.query.user_id+") AS todrink_number, "+"(SELECT COUNT(feed.beer_id) AS beer_count FROM feed WHERE user_id = "+a.query.user_id+' AND feed.type = "RATE") AS beer_number, '+"(SELECT COUNT(owner_id) AS follower_count FROM followers WHERE owner_id = "+a.query.user_id+") AS follows, "+"(SELECT COUNT(follower_id) AS following_count FROM followers WHERE follower_id = "+a.query.user_id+") AS following "+"LEFT OUTER JOIN followers ON (follower_id = "+a.session.user_id+") AND (owner_id = "+a.query.user_id+") "+"WHERE (users.user_id = "+c+") AND (feed.user_id = "+c+') AND (feed.beer_id = beers.id) AND (feed.type = "RATE") ORDER BY feed.created_date DESC;',function(d,e,f){if(d)throw d;console.log(e);e==""?client.query("SELECT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, beer_number.beer_count, follows.follower_count, following.following_count, todrink_number.todrink_count, followers.created_date FROM users, (SELECT COUNT(todrink.user_id) AS todrink_count FROM todrink WHERE todrink.user_id = "+a.query.user_id+") AS todrink_number, "+"(SELECT COUNT(feed.beer_id) AS beer_count FROM feed WHERE user_id = "+a.query.user_id+' AND feed.type = "RATE") AS beer_number, '+"(SELECT COUNT(owner_id) AS follower_count FROM followers WHERE owner_id = "+a.query.user_id+") AS follows, "+"(SELECT COUNT(follower_id) AS following_count FROM followers WHERE follower_id = "+a.query.user_id+") AS following "+"LEFT OUTER JOIN followers ON (follower_id = "+a.session.user_id+") AND (owner_id = "+a.query.user_id+") "+"WHERE users.user_id = "+c,function(a,c,d){if(a)throw a;console.log(c);b.send(c)}):b.send(e)});client.query("UPDATE notifications SET notifications.read = 1 WHERE partner_id = "+a.query.user_id+' AND type = "FOLLOW";',function(a,b,c){if(a)throw a;console.log(b)})});app.get("/get-to-drink-list",checkAuth,function(a,b){client.query("SELECT todrink.beer_id, todrink.user_id, beers.name AS beer_name, breweries.name AS brewery FROM todrink, beers, breweries WHERE todrink.beer_id = beers.id AND beers.brewery_id = breweries.id AND todrink.user_id = "+a.query.user_id,function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/get-activity",checkAuth,function(a,b){client.query("SELECT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name FROM users, feed, beers WHERE (users.user_id = "+a.query.user_id+") AND (feed.user_id = "+a.query.user_id+') AND (feed.beer_id = beers.id) AND (feed.type = "RATE") ORDER BY feed.created_date DESC;',function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/get-followers",checkAuth,function(a,b){client.query("SELECT DISTINCT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name FROM users, feed, beers, followers WHERE (followers.owner_id = "+a.query.user_id+') AND (followers.follower_id = users.user_id) AND (feed.user_id = users.user_id) AND (feed.beer_id = beers.id) AND (feed.type = "RATE") GROUP BY users.user_name ORDER BY feed.created_date DESC;',function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/get-following",checkAuth,function(a,b){client.query("SELECT DISTINCT users.user_name, users.first_name, users.last_name, users.avatar, users.user_id, feed.beer_id, feed.rating, beers.name AS beer_name FROM users, feed, beers, followers WHERE (followers.follower_id = "+a.query.user_id+') AND (followers.owner_id = users.user_id) AND (feed.user_id = users.user_id) AND (feed.beer_id = beers.id) AND (feed.type = "RATE") GROUP BY users.user_name ORDER BY feed.created_date DESC;',function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/get-notifications",checkAuth,function(a,b){client.query("SELECT owner_id, partner_id, type, feed_id FROM notifications WHERE notifications.read = 0 AND notifications.owner_id = "+a.session.user_id,function(a,c,d){if(a)throw a;console.log(c);b.send(c)})});app.get("/get-notifications-list",checkAuth,function(a,b){var c=new Date,d=dateToString(c);client.query('SELECT notifications.owner_id, notifications.partner_id, notifications.type, notifications.read, notifications.feed_id, ROUND(TIMESTAMPDIFF(SECOND,notifications.created_date,"'+d+'")/60) AS time, notifications.created_date, users.first_name, users.last_name, users.avatar '+"FROM notifications, users "+"WHERE notifications.owner_id = "+a.session.user_id+" AND users.user_id = notifications.partner_id ORDER BY notifications.created_date DESC;",function(a,c,d){if(a)throw a;console.log(c);b.send(c);client.query("UPDATE notifications SET notifications.read = 1 WHERE notifications.read = 0;",function(a,b,c){if(a)throw a;console.log(b)})})});app.get("/follow",checkAuth,function(a,b){var c=new Date,d=dateToString(c);client.query("INSERT INTO followers SET owner_id = ?, follower_id = ?, created_date = ?",[a.query.owner_id,a.session.user_id,d],function(c,e,f){if(c)throw c;console.log(e);a.query.owner_id!=a.session.user_id&&client.query("INSERT INTO notifications SET owner_id = ?, partner_id = ?, type = ?, created_date = ?",[a.query.owner_id,a.session.user_id,"FOLLOW",d],function(a,b,c){if(a)throw a});b.json({status:"success"})})});app.get("/unfollow",checkAuth,function(a,b){var c=new Date,d=dateToString(c);client.query("DELETE FROM followers WHERE (owner_id = "+a.query.owner_id+") AND (follower_id = "+a.session.user_id+")",function(a,c,d){if(a)throw a;if(c!=undefined){console.log(c);b.json({status:"success"})}})});app.get("/auth/twitter",function(a,b){oa.getOAuthRequestToken(function(c,d,e,f){if(c){console.log(c);b.send("yeah no. didn't work.")}else{a.session.oauth={};a.session.oauth.token=d;console.log("oauth.token: "+a.session.oauth.token);a.session.oauth.token_secret=e;console.log("oauth.token_secret: "+a.session.oauth.token_secret);b.redirect("https://twitter.com/oauth/authenticate?oauth_token="+d)}})});app.get("/auth/twitter/callback",function(a,b,c){if(a.session.oauth){a.session.oauth.verifier=a.query.oauth_verifier;var d=a.session.oauth,e=!1;oa.getOAuthAccessToken(d.token,d.token_secret,d.verifier,function(c,d,f,g){if(c){console.log(c);b.send(c[0].data)}else{a.session.oauth.access_token=d;a.session.oauth.access_token_secret=f;client.query("SELECT user_name FROM "+user_table+' WHERE user_name = "'+g.screen_name+'";',function(c,h,i){if(c)throw c;for(var j=0;j<h.length;j++)if(g.screen_name==h[j].user_name){e=!0;console.log(g.screen_name+"=="+h[j].user_name)}console.log("does user exist already? "+e);var k=new Date,l=dateToString(k);if(e){a.session.user_name=g.screen_name;a.session.user_id=g.user_id;console.log(l);b.redirect("/dashboard")}else{console.log(l);var m=g.screen_name;a.session.user_name=m;a.session.user_id=g.user_id;$.ajax({cache:!1,url:"https://api.twitter.com/1/users/show.json",data:{screen_name:g.screen_name,user_id:g.user_id},dataType:"jsonp",success:function(c){a.session.avatar=c.profile_image_url;var e=c.name,h=e.split(" ");client.query("INSERT INTO "+user_table+" "+"SET user_id = ?, user_name = ?, full_name = ?, first_name = ?, last_name = ?, avatar = ?, access_token = ?, access_token_secret = ?, created_date = ?",[g.user_id,g.screen_name,e,h[0],h[1],a.session.avatar,d,f,l]);b.redirect("/dashboard")}})}})}})}else c(new Error("you're not supposed to be here."))});console.log("Connected...");