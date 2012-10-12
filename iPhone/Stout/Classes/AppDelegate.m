/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

//
//  AppDelegate.m
//  Stout
//
//  Created by Sterling Salzberg on 8/22/12.
//  Copyright Sterling Salzberg 2012. All rights reserved.
//

#import "AppDelegate.h"
#import "MainViewController.h"
#import "XtifyCordovaPlugin.h"

#ifdef CORDOVA_FRAMEWORK
    #import <Cordova/CDVPlugin.h>
    #import <Cordova/CDVURLProtocol.h>
#else
    #import "CDVPlugin.h"
    #import "CDVURLProtocol.h"
#endif

#import "XLappMgr.h"


@implementation AppDelegate

@synthesize invokeString, launchNotification, snid;
@synthesize window, viewController;

- (id) init
{
    
    if (self = [super init]) {
        XLXtifyOptions *anXtifyOptions=[XLXtifyOptions getXtifyOptions];
        [[XLappMgr get ]initilizeXoptions:anXtifyOptions];
        alreadyHandlingNotification = false;
    }
    
	/** If you need to do any extra app-specific initialization, you can do it here
	 *  -jm
	 **/
    NSHTTPCookieStorage *cookieStorage = [NSHTTPCookieStorage sharedHTTPCookieStorage]; 
    [cookieStorage setCookieAcceptPolicy:NSHTTPCookieAcceptPolicyAlways];
    
    [CDVURLProtocol registerURLProtocol];
    
    return [super init];
}



- (void)application:(UIApplication *)app didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken
{
    NSLog(@"Succeeded registering for push notifications. Device token: %@", devToken);
    [[XLappMgr get] registerWithXtify:devToken ];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)pushMessage
{
    NSLog(@"Receiving notification, %@", pushMessage);
    self.launchNotification = pushMessage;
    self.snid = [launchNotification objectForKey:@"SN"];
    [[XLappMgr get] insertSimpleAck:self.snid];
    
    BOOL ignoreNotificationAlert=NO;
    
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 40000
    // get state -applicationState is only supported on 4.0 and above
    if (![[UIApplication sharedApplication] respondsToSelector:@selector(applicationState)])
    {
        ignoreNotificationAlert = NO;
    }
    else
    {
        UIApplicationState state = [[UIApplication sharedApplication] applicationState];
        if (state == UIApplicationStateActive) {
            NSLog(@"Got notification and app is running. Need to display an alert (state is UIApplicationStateActive)");
            ignoreNotificationAlert=YES; // display an alert
        }
        else {
            NSLog(@"Got notification while app was in the background; (user selected the Open button");
            ignoreNotificationAlert =TRUE; // don't display another alert
        }
    }
#endif
    if(!ignoreNotificationAlert)
    {
        if(!alreadyHandlingNotification)
            [self showAlert:pushMessage];
        else    {
            NSLog(@"already handling a notification");
        }
    }
    else {
        [[XLappMgr get] insertSimpleAck:[self.launchNotification objectForKey:@"SN"]];
        [self sendPayloadToWebView];
    }
}



#pragma UIApplicationDelegate implementation

/**
 * This is main kick off after the app inits, the views and Settings are setup here. (preferred - iOS4 and up)
 */
- (BOOL) application:(UIApplication*)application didFinishLaunchingWithOptions:(NSDictionary*)launchOptions
{
    NSLog(@"App finished launching");
    NSURL* url = [launchOptions objectForKey:UIApplicationLaunchOptionsURLKey];
    if (url && [url isKindOfClass:[NSURL class]]) {
        self.invokeString = [url absoluteString];
		NSLog(@"Stout launchOptions = %@", url);
    }
    
    // cache notification, if any, until webview finished loading, then process it if needed
    // assume will not receive another message before webview loaded
  
    self.launchNotification = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
    NSLog(@"app starting with notif? %@", self.launchNotification);
    application.applicationIconBadgeNumber = 0;
    
    CGRect screenBounds = [[UIScreen mainScreen] bounds];
    self.window = [[[UIWindow alloc] initWithFrame:screenBounds] autorelease];
    self.window.autoresizesSubviews = YES;
    
    CGRect viewBounds = [[UIScreen mainScreen] applicationFrame];
    
    self.viewController = [[[MainViewController alloc] init] autorelease];
    self.viewController.useSplashScreen = YES;
    self.viewController.wwwFolderName = @"www";
    self.viewController.startPage = @"index.html";
    self.viewController.view.frame = viewBounds;
    
    // over-ride delegates
    self.viewController.webView.delegate = self;
    self.viewController.commandDelegate = self;

    // check whether the current orientation is supported: if it is, keep it, rather than forcing a rotation
    BOOL forceStartupRotation = YES;
    UIDeviceOrientation curDevOrientation = [[UIDevice currentDevice] orientation];
    
    if (UIDeviceOrientationUnknown == curDevOrientation) {
        // UIDevice isn't firing orientation notifications yet… go look at the status bar
        curDevOrientation = (UIDeviceOrientation)[[UIApplication sharedApplication] statusBarOrientation];
    }
    
    if (UIDeviceOrientationIsValidInterfaceOrientation(curDevOrientation)) {
        for (NSNumber *orient in self.viewController.supportedOrientations) {
            if ([orient intValue] == curDevOrientation) {
                forceStartupRotation = NO;
                break;
            }
        }
    } 
    
    if (forceStartupRotation) {
        NSLog(@"supportedOrientations: %@", self.viewController.supportedOrientations);
        // The first item in the supportedOrientations array is the start orientation (guaranteed to be at least Portrait)
        UIInterfaceOrientation newOrient = [[self.viewController.supportedOrientations objectAtIndex:0] intValue];
        NSLog(@"AppDelegate forcing status bar to: %d from: %d", newOrient, curDevOrientation);
        [[UIApplication sharedApplication] setStatusBarOrientation:newOrient];
    }
    
    [self.window addSubview:self.viewController.view];
    [self.window makeKeyAndVisible];    
    
    return YES;
}




- (void)applicationDidEnterBackground:(UIApplication *)application
{
    NSLog(@"Application is about to Enter Background");
    [[XLappMgr get] appEnterBackground];
}

//Add or incorporate function into your Application Delegate file
- (void)applicationDidBecomeActive:(UIApplication *)application {
    NSLog(@"Application moved from inactive to Active state");
    [[XLappMgr get] appEnterActive];
}

//Add or incorporate function into your Application Delegate file
- (void)applicationWillEnterForeground:(UIApplication *)application {
    NSLog(@"Application moved to Foreground");
    [[XLappMgr get] appEnterForeground];
}

-(void)applicationWillTerminate:(UIApplication *)application
{
    NSLog(@"applicationWillTerminate");
    [[XLappMgr get] applicationWillTerminate];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *) error
{
    NSLog(@"Failed to register with error: %@", error);
    // for simulator, fake a token for debugging
#if TARGET_IPHONE_SIMULATOR == 1
    // register with xtify
    [[XLappMgr get] registerWithXtify:nil ];
#pragma mark -
#pragma mark Using simulator
    NSLog(@"Notification is disabled in simulator, but inbox messages should be working");
#endif
}

// for debugging in the background. write to log file
- (void) redirectConsoleLogToDocumentFolder
{
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentsDirectory = [paths objectAtIndex:0];
    NSString *logPath = [documentsDirectory stringByAppendingPathComponent:@"console.log"];
    freopen([logPath cStringUsingEncoding:NSASCIIStringEncoding],"a+",stderr);
}



// this happens while we are running ( in the background, or from within our own app )
// only valid if FooBar.plist specifies a protocol to handle
- (BOOL) application:(UIApplication*)application handleOpenURL:(NSURL*)url 
{
    if (!url) { 
        return NO; 
    }
    
	// calls into javascript global function 'handleOpenURL'
    NSString* jsString = [NSString stringWithFormat:@
                          "window.setTimeout(function() { \n"
                          "handleOpenURL(\"%@\"); \n"
                          "},1);", url];
    [self.viewController.webView stringByEvaluatingJavaScriptFromString:jsString];
    
    // all plugins will get the notification, and their handlers will be called 
    [[NSNotificationCenter defaultCenter] postNotification:[NSNotification notificationWithName:CDVPluginHandleOpenURLNotification object:url]];
    
    return YES;    
}




/**
 Called when the webview finishes loading.  This stops the activity view and closes the imageview
 */

-(void) showAlert:(NSDictionary *) push{
    self.launchNotification = push;
    NSBundle *bundle = [NSBundle mainBundle];
    NSDictionary *info = [bundle infoDictionary];
    NSDictionary *pusdic = [push objectForKey:@"aps"];
    NSDictionary *alrt = [pusdic objectForKey:@"alert"];
    NSString *prodName = [[NSString alloc]initWithString:[info objectForKey:@"CFBundleDisplayName"]];
    NSString *buttonName = [alrt objectForKey:@"action-loc-key"];
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:prodName message:[alrt objectForKey:@"body"] delegate:self cancelButtonTitle:@"Cancel" otherButtonTitles:buttonName, nil];
    [alert show];
    [[XLappMgr get] insertSimpleDisp:self.snid];
    alreadyHandlingNotification = true;
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if (buttonIndex == 0)
    {
        alreadyHandlingNotification = false;
        [[XLappMgr get] insertSimpleClear:self.snid];
        //cancel clicked ...do your action
    }
    else if (buttonIndex == 1)
    {
        [[XLappMgr get] insertSimpleClick:self.snid];
        [self sendPayloadToWebView];
        alreadyHandlingNotification = false;
    }
}

- (void) sendPayloadToWebView
{
    if (launchNotification) {
        XtifyCordovaPlugin *pushHandler = [self getCommandInstance:@"XtifyCordovaPlugin"];
        pushHandler.notificationMessage = self.launchNotification;
        [pushHandler notificationReceived];
        self.launchNotification = nil;
    }
}

- (void) registerPlugin:(CDVPlugin*)plugin withClassName:(NSString*)className
{
    return;
}




#pragma PGCommandDelegate implementation

- (id) getCommandInstance:(NSString*)className
{
	return [self.viewController getCommandInstance:className];
}

- (BOOL) execute:(CDVInvokedUrlCommand*)command
{
	return [self.viewController execute:command];
}

- (NSString*) pathForResource:(NSString*)resourcepath;
{
	return [self.viewController pathForResource:resourcepath];
}

#pragma UIWebDelegate implementation

//- (void) webViewDidFinishLoad:(UIWebView*) theWebView 
//{
//	// only valid if FooBar.plist specifies a protocol to handle
//	if (self.invokeString)
//	{
//		// this is passed before the deviceready event is fired, so you can access it in js when you receive deviceready
//		NSString* jsString = [NSString stringWithFormat:@"var invokeString = \"%@\";", self.invokeString];
//		[theWebView stringByEvaluatingJavaScriptFromString:jsString];
//	}
//	
//	 // Black base color for background matches the native apps
//   	theWebView.backgroundColor = [UIColor blackColor];
//    
//	return [self.viewController webViewDidFinishLoad:theWebView];
//}

- (void)webViewDidFinishLoad:(UIWebView *)theWebView {
    // only valid if XtifyPhoneGapPhase2.plist specifies a protocol to handle
    if(self.invokeString)
    {
        // this is passed before the deviceready event is fired, so you can access it in js when you receive deviceready
        NSString* jsString = [NSString stringWithFormat:@"var invokeString = \"%@\";", self.invokeString];
        [theWebView stringByEvaluatingJavaScriptFromString:jsString];
    }
    // Black base color for background matches the native apps
    theWebView.backgroundColor = [UIColor blackColor];
    XtifyCordovaPlugin *xPlugin = [self getCommandInstance:@"XtifyCordovaPlugin"];
    [xPlugin printXtifySDKVersion];
    if (launchNotification) {
        self.snid = [launchNotification objectForKey:@"SN"];
        [[XLappMgr get] insertSimpleAck:self.snid];
        [self sendPayloadToWebView];
    }
    return [ self.viewController webViewDidFinishLoad:theWebView ];
}



- (void) webViewDidStartLoad:(UIWebView*)theWebView 
{
	return [self.viewController webViewDidStartLoad:theWebView];
}

- (void) webView:(UIWebView*)theWebView didFailLoadWithError:(NSError*)error 
{
	return [self.viewController webView:theWebView didFailLoadWithError:error];
}

- (BOOL) webView:(UIWebView*)theWebView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType
{
	return [self.viewController webView:theWebView shouldStartLoadWithRequest:request navigationType:navigationType];
}

- (void) dealloc
{
	[super dealloc];
}



@end
