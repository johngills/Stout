//
//  XLappMgr.h
//
//  Created by Gilad on 3/1/11.
//  Copyright 2011 Xtify. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import "XLXtifyOptions.h"

@protocol XLInboxDelegate;

@class XLServerMgr,XLInboxMgr;
@class UIApplication ;
@class xASIHTTPRequest;
//@class XLXtifyOptions;

@interface XLappMgr : NSObject <UIAlertViewDelegate> 
{

	XLServerMgr *serverMgr;
	XLInboxMgr *inboxMgr;
	BOOL handleNotification;
	NSDictionary *lastPush ;//Apple last push notification dictionary
	NSString *anAppKey ; // xtify application key
	NSDate * lastLocationUpdateDate ;
	NSString *prodName ; // product name from info plist
	// Badge
	XLBadgeManagedType badgeMgrMethod;
	// The delegate, developer needs to manage setting and talking to delegate in subclasses
	id <XLInboxDelegate> inboxDelegate;
	// Called on the delegate (if implemented) when a message read in the Inbox. Default is messageCountChanged:
	SEL didInboxChangeSelector;
	SEL developerNavigationControllerSelector ;
	SEL developerInboxNavigationControllerSelector ;
	SEL developerCustomActionSelector ;
	SEL developerXidNotificationSelector ;
    NSString * snId;
	NSTimer* timerBulkUpdate;
    NSMutableArray *activeTagArray;

	BOOL isInGettingMsgLoop ;// set to yes by the inboxMgr, when getting few messages from the server to prevent multiple updates
    NSString *curCountry;
    NSString *curLocale;
    NSString *userTimeZone;
    BOOL multipleMarketsFlag ;
}

+(XLappMgr*)get;
//Framework
- (void) initilizeXoptions:(XLXtifyOptions *)xOptions;
-(void) registerForPush ;
-(void) launchWithOptions:(UIApplication *)application andOptions:(NSDictionary *)launchOptions;
-(void) registerWithXtify:(NSData *)devToken ;
// 
- (void) doXtifyRegistration:(NSString*) newAppKey;
- (void) updateXtifyRegistration:(NSString *)newAppKey;

-(void) updateAppKey:(NSString *)appKey ;
-(void) appEnterBackground;
-(void) appEnterActive;
-(void) appEnterForeground;
-(void) appReceiveNotification:(NSDictionary *)userInfo;
-(void) displayGenericAlert:(NSString *) messageContent ;
-(void) updateLocDate:(NSDate *)updateDate;
-(void) finishHandleNotification;
-(void) applicationWillTerminate;
-(void) updateStats:(NSString *)type: (NSString *)ts;
- (void) sendActionsToServerBulk:(NSTimer*)timer;

// Locaton
- (BOOL) getLocationRequiredFlag ;
- (BOOL) getBackgroundLocationRequiredFlag; // get the BG location tracking flag
-(BOOL) isLocationSettingOff ;
- (void) updateLocationRequiredFlag:(BOOL )value;
- (void) updateBackgroundLocationFlag:(BOOL )value;
- (CLLocationCoordinate2D )getLastLnownLocation ;
- (void) updateLocation;
- (void) updateLocationWithCoordinate:(CLLocationCoordinate2D) latLon andAlt:(float)altitude andAccuracy:(float)accuracy;

//Notification
-(void)appDisplayNotificationNoAlert:(NSDictionary *)pushMessage;
-(void) appDisplayNotification:(NSDictionary *)pushMessage withAlert:(BOOL) alertFlag;
-(void) getPenddingNotifications;
- (UIViewController *)getInboxViewController ; // allow developer hook the inbox VC
// badge management
-(NSInteger) getSpringBoardBadgeCount ;
-(void)		 setSpringBoardBadgeCount:(NSInteger) count;
-(NSInteger) getServerBadgeCount;
-(void)		setServerBadgeCount:(NSInteger) count;
-(void)		setBadgeCountSpringBoardAndServer:(NSInteger) count;
-(void) updateBadgeCount:(NSInteger) value andOperator:(char ) op;//‘op’ is either ‘+’ or ‘-’ or nil
-(NSInteger) getInboxUnreadMessageCount ;
-(void) inboxChangedInternal:(NSInteger) count; // used by the Inbox to notify when rich message was read/received

// Called when inbox message count changed, lets the delegate know via didInboxChangeSelector
- (void)messageCountChanged;
// Called when inbox displays a rich details dialog
- (UINavigationController *)getDeveloperNavigationController;
//called when a rich push arrive and the app uses Tabbar
- (void) moveTabbarToInboxNavController ;
// called when action in rich message is set to CST; informs delegate via developerCustomActionSelector
- (void) performDeveloperCustomAction:(NSString *)actionData ;

//to manage the badge flag
- (XLBadgeManagedType) getBadgeMethod;
- (void) updateBadgeFlag:(BOOL )value;
-(void) setSnid:(NSString * )value;
- (NSString *) getSnid;
// Tags
- (void)addTag:(NSMutableArray *)tags;
- (NSString *) getTagString:(NSMutableArray *) tags;
-(void)doTagRequest:(NSString *) tagUrlString;
- (void)unTag:(NSMutableArray *)tags;
- (void)setTag:(NSMutableArray *)tags;
- (void) getActiveTags;
- (void)successActiveTagMethod:(xASIHTTPRequest *) request;
-(void)doActiveTagsRequest:(NSString *) tagString;
-(NSString *)getXid;
- (void) checkPushEnabled;
- (NSString *) getPushSettingValue;
-(void) changeDbPushFlag: (NSString *) flag;



//Metric wrappers
- (void) insertSimpleAck:(NSString *) simpleId;
- (void) insertSimpleDisp:(NSString *) simpleId;
- (void) insertSimpleClear:(NSString *) simpleId;
- (void) insertSimpleClick:(NSString *) simpleId;
// When using custom inbox, developer needs to update metric
- (void) insertRichDisplay:(NSString *) richId;  // user displays a rich message
- (void) insertRicShare:(NSString *) richId;    // user shares a rich message via email
- (void) insertRichAction:(NSString *) richId; // user selects the action (call, safari, etc.) from therich message
- (void) insertRichMap:(NSString *) richId;     // user displays the map from a locaton based rich message
- (void) insertRichDelete:(NSString *) richId;  // user deletes a rich message
- (void) insertInboxClick; // usser selects the inbox list

//User preferences
-(void) sendTimeZoneToServer: (NSString*)currentTz;
-(void) hasTZChanged;
-(NSString *)getSdkVer;
-(void) recreateTagDb;
-(NSString *) getPushEnabled;

// Mutli markets
- (BOOL) isMultipleMarkets ;
- (void)addLocale:(NSString*)locale; // initilazie and updated when first starts, in settings page and register update 
- (void)untagLocale:(NSString*)locale; // in register update

-(NSMutableDictionary *)getAppDetails;
-(void) saveRegTimestamp;
-(NSString *) getRegTimestamp;
-(void) removeAllNotifications;

@property (nonatomic, retain) NSString *anAppKey;
@property (nonatomic, retain) NSString *userTimeZone;
@property (nonatomic, retain) 	NSDate * lastLocationUpdateDate ;
@property (nonatomic, retain) NSString *prodName;
@property (nonatomic, assign)	BOOL isInGettingMsgLoop;
@property (nonatomic, retain) NSTimer* timerBulkUpdate;

@property (nonatomic, retain) NSDictionary *lastPush;

//badge management
@property (assign, nonatomic) id inboxDelegate;
@property (assign) SEL didInboxChangeSelector, developerCustomActionSelector;
@property (assign) SEL developerNavigationControllerSelector, developerInboxNavigationControllerSelector;

//Locale
@property (nonatomic, retain) NSString *curCountry;
@property (nonatomic, retain) NSString *curLocale;
@property (nonatomic, retain) NSMutableArray *activeTagArray;

//Xid
@property (assign) SEL  developerXidNotificationSelector ;
-(void) xidChanged ;

@end
