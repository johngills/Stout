//
//  XtifyCordovaPlugin.h
//  XtifyCordova
//
//  Created by Sucharita on 3/1/12.
//  Copyright (c) 2012 Xtify.com. All rights reserved.
//



#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface XtifyCordovaPlugin : CDVPlugin {
    
    NSString* callbackID;  
    NSDictionary *notificationMessage;
    
}

@property (nonatomic, copy) NSString* callbackID;

//Instance Method  
- (void) print:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void) printXid:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void) printLocation:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

- (void) getSpringBoardBadgeCount:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void) setSpringBoardBadgeCount:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

- (void) notificationReceived;
- (void) clearNotifications:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options;
- (void) printXtifySDKVersion;
@property (strong, nonatomic) NSDictionary *notificationMessage;


@end