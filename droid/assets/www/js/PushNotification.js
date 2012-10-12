function storeXid(xid,user_id,latitude,longitude,type) {
	$.ajax({
		cache: false,
		url: url + '/store-xid',
		data: { latitude: latitude, longitude: longitude, xid: xid, user_id: user_id },
		success: function(results) {
					if (results.status == 'success') {
						console.log('success saving Xid');
						if (type == 'registration') {
							window.location='registration.html#_index';
						} else if (type == 'dashboard') {
							window.location='dashboard.html#_index';
						}
					} else {
						console.log('error saving Xid');
					}
				},
		error: function(results) {
					console.log(results);
					return false;
				}
	});
}

function replaceCustomData(customString){
    console.log(unescape(customString));
    
    var data = unescape(customString),
		results = data.split('?'),
		url = results[0],
		action = results[1],
		id = results[2];
		
	console.log('action: ' + action + ', id: ' + id);
	
	switch(action) {
		case 'view_profile':
			console.log('got here');
			loadProfile(id,true);
			break;
		case 'feed_detail':
			feedDetail(id,true);
			break;
		case 'beer_detail':
			beerDetail(id);
			break;
	}
	
	clearNotificationsAndBadgeNative();
}
function getXtifySDKVersion(sdkVersion){
    sdkver.innerHTML = sdkVersion;
}
function getCustomDataForLastPush() {
    
    callNativeFunction(
                       ["GetData"] ,
                       
                       function(result) {
                       		console.log(unescape(result));
                       },
                       
                       function(error) {
                       		console.log("no custom data");
                       }
                       );  
    
}

function getXidFromNative(user_id,type) {
    
    callXidNativeFunction(
                          ["GetXid"] ,
                          function(xid) {
							console.log('got into getXidFromNative');
							db.transaction(function(tx) {
								tx.executeSql('INSERT INTO user (xid) VALUES ("' + xid + '");', [], successCB, errorCB);
								console.log('Xid from getXidFromNative(): ' + xid);
								getLocationFromNative(user_id,xid,type);
							});
                          },
                          
                          function(error) {
							console.log("no xid");
                          }
                          );  
   
}

// ORIGINAL FUNCTION
//
/*
function getXidFromNative(user_id) {
    
    callXidNativeFunction(
                          ["GetXid"] ,
                          function(result) {
                          	console.log('got xid: ' + result);
							getLocationFromNative(user_id,result);
                          },
                          
                          function(error) {
                          console.log("no xid");
                          }
                          );  
    
}
*/

function getLocationFromNative(user_id,xid,type) {
    
    callLocationNativeFunction(
                               ["GetLocation"] ,
                               function(result) {
									
									var data = result.split(','),
										latitude = data[0].split(':'),
										longitude = data[1].split(':');
									
									console.log(latitude[1] + ' ' + longitude[1]);
									
									if (result != 'Nil' && result != null && result != undefined) {
										storeXid(xid,user_id,latitude[1],longitude[1],type);
									} else {
										storeXid(xid,user_id,null,null,type);
									}
									
/*
									$.ajax({
										cache: false,
										url: url + '/store-location',
										data: { latitude: latitude[1], longitude: longitude[1], user_id: user_id },
										success: function(results) {
											console.log('results: ' + results);
											console.log('type: ' + type);
											if (type == 'registration') {
												window.location='registration.html#_index';
											} else if (type == 'dashboard') {
												window.location='dashboard.html#_index';
											}
										}
									});
*/
                               },
                               
                               function(error) {
                               		console.log('there was an error');
                               		return false;
                               }
                               );  
    
}

function setBadgeToNative() {
    var val = document.getElementById('badgeCount').value;
    setBadgeCountNativeFunction(
                               [val] ,
                               function(result) {
                               result4.innerHTML= result;
                               },
                               
                               function(error) {
                               result4.innerHTML= "Error setting badge";
                               }
                               );  
}
function getBadgeFromNative() {
    getBadgeCountNativeFunction(
                                ["GetBadge"] ,
                                function(result) {
                                result5.innerHTML= result;
                                },
                                    
                                function(error) {
                                result5.innerHTML= "Error getting badge";
                                }
                                );  
    
}


function clearNotificationsAndBadgeNative() {
    clearNotificationsAndBadge(
                                ["clearNotifsBadge"] ,
                                function(result) {
                                result6.innerHTML= result;
                                },
                                
                                function(error) {
                                result6.innerHTML= "Error clearing notifications and badge";
                                }
                                );  
    
}

function callNativeFunction(types, success, fail) {
    return Cordova.exec(success, fail, "XtifyCordovaPlugin", "print", types);
}    

function callXidNativeFunction(types, success, fail) {
    return Cordova.exec(success, fail, "XtifyCordovaPlugin", "printXid", types);
}

function callLocationNativeFunction(types, success, fail) {
    return Cordova.exec(success, fail, "XtifyCordovaPlugin", "printLocation", types);
}    

function setBadgeCountNativeFunction(types, success, fail){
    Cordova.exec(success, fail, "XtifyCordovaPlugin", "setSpringBoardBadgeCount", types);
}

function getBadgeCountNativeFunction(types, success, fail){
    Cordova.exec(success, fail, "XtifyCordovaPlugin", "getSpringBoardBadgeCount", types);
}

function clearNotificationsAndBadge(types, success, fail){
    Cordova.exec(success, fail, "XtifyCordovaPlugin", "clearNotifications", types);
}