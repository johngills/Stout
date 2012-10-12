//
//  XtifyCordovaPlugin.m
//  XtifyCordova
//
//  Created by Sucharita on 3/1/12.
//  Copyright (c) 2012 Xtify.com. All rights reserved.
//

#import "XtifyCordovaPlugin.h" 
#import "XLappMgr.h"
#import <CoreLocation/CoreLocation.h>
#import "XLappMgr.h"

@implementation XtifyCordovaPlugin 

@synthesize callbackID, notificationMessage;

-(void)print:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options  
{
    NSLog(@"Reached here");
    
    //The first argument in the arguments parameter is the callbackID.
    //We use this to send data back to the successCallback or failureCallback
    //through PluginResult.   
    self.callbackID = [arguments pop];
      
    NSDictionary *pushDic = [[XLappMgr get] lastPush];
    NSString *customData = [pushDic objectForKey:@"customKey"];
    
    //Create the Message that we wish to send to the Javascript
    NSString *stringToReturn;
    if (customData != nil)
        stringToReturn = customData;
    else
        stringToReturn = @"No data item called customKey";

    //Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:                        [stringToReturn stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    
    if(customData != nil)
    {
        //Call  the Success Javascript function
        [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
        
    }else
    {    
        //Call  the Failure Javascript function
        [self writeJavascript: [pluginResult toErrorCallbackString:self.callbackID]];
        
    }
    
}
-(void)printXid:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options  
{
    NSLog(@"Reached xid here");
    
    //The first argument in the arguments parameter is the callbackID.
    //We use this to send data back to the successCallback or failureCallback
    //through PluginResult.   
    self.callbackID = [arguments pop];
    
    NSString *xid = [[XLappMgr get] getXid];
    
    //Create the Message that we wish to send to the Javascript
    NSString *stringToReturn;
    if (xid != nil)
        stringToReturn = xid;
    else
        stringToReturn = @"No xid";
    
    //Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:                        [stringToReturn stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    
    if(xid != nil)
    {
        //Call  the Success Javascript function
        [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
        
    }else
    {    
        //Call  the Failure Javascript function
        [self writeJavascript: [pluginResult toErrorCallbackString:self.callbackID]];
        
    }
    
}


-(void)printLocation:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options  
{
    NSLog(@"Reached location here");
    
    //The first argument in the arguments parameter is the callbackID.
    //We use this to send data back to the successCallback or failureCallback
    //through PluginResult.   
    self.callbackID = [arguments pop];
    
    
    CLLocationCoordinate2D lastLnownLocation = [[XLappMgr get] getLastLnownLocation];
    
    NSString* latString = [NSString stringWithFormat:@"%f", lastLnownLocation.latitude];
	NSString* lonString = [NSString stringWithFormat:@"%f", lastLnownLocation.longitude];
    
    NSString *locationString;
    
    if(lastLnownLocation.latitude == 0 && lastLnownLocation.longitude == 0)
    {
        locationString = @"Nil";
    }
    else
    {
        locationString = [NSString stringWithFormat:@"%@%@%@%@" , @"Latitude:", latString, @",Longitude:" , lonString]; 
    }
    //Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:                        [locationString stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    
    if(locationString != nil)
    {
        //Call  the Success Javascript function
        [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
        
    }else
    {    
        //Call  the Failure Javascript function
        [self writeJavascript: [pluginResult toErrorCallbackString:self.callbackID]];
        
    }
    
}

-(void)getSpringBoardBadgeCount:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options
{
    NSLog(@"Reached springboard badge count get");
    
    //The first argument in the arguments parameter is the callbackID.
    //We use this to send data back to the successCallback or failureCallback
    //through PluginResult.   
    self.callbackID = [arguments pop];
   
    
    NSString *badgeString = [NSString stringWithFormat:@"%d", [[XLappMgr get] getSpringBoardBadgeCount]];
       //Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:                        [badgeString stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    
    if(badgeString != nil)
    {
        //Call  the Success Javascript function
        [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
        
    }else
    {    
        //Call  the Failure Javascript function
        [self writeJavascript: [pluginResult toErrorCallbackString:self.callbackID]];
        
    }
    
}

-(void)setSpringBoardBadgeCount:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options
{
    NSLog(@"Reached springboard badge count set");
    
    //The first argument in the arguments parameter is the callbackID.
    //We use this to send data back to the successCallback or failureCallback
    //through PluginResult.   
    self.callbackID = [arguments objectAtIndex:0];
    
    NSString* badge = [arguments objectAtIndex:1];
    
    [[XLappMgr get] setSpringBoardBadgeCount:[badge intValue]];
    
    
    NSString *badgeSuccess = @"Success!";
    //Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:                        [badgeSuccess stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];

        [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
        
}

- (void)notificationReceived {
        NSString *custData = [notificationMessage objectForKey:@"customKey"];
        if(custData == nil)
        {
            custData = @"No key called customKey in payload";
        }
        NSString *jsStatement = [NSString stringWithFormat:@"replaceCustomData(%@%@%@);", @"\"", custData, @"\""];
        
        [self writeJavascript:jsStatement];
      
        self.notificationMessage = nil;

}

- (void) printXtifySDKVersion{
    NSString *sdkVersion = [[XLappMgr get] getSdkVer];
    NSString *jsStatement = [NSString stringWithFormat:@"getXtifySDKVersion(%@%@%@);", @"\"", sdkVersion, @"\""];
    
    [self writeJavascript:jsStatement];
}


// Use this to clear all notifications and badge
- (void) clearNotifications:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options{
    [[UIApplication sharedApplication] setApplicationIconBadgeNumber: 0];
    [[UIApplication sharedApplication] cancelAllLocalNotifications];
    [[XLappMgr get] setServerBadgeCount:0];
    self.callbackID = [arguments objectAtIndex:0];
    
    NSString *clearSuccess = @"Success!";
    //Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:                        [clearSuccess stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    
    
    [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
}

@end