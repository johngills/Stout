//
//  XLXtifyOptions.h
//  XtifyPush Library
//
//  Created by Gilad on 5/11/12.
//  Copyright (c) 2012 Xtify. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef enum _XLBadgeManagedType {
	XLInboxManagedMethod = 0,
    XLDeveloperManagedMethod = 1
} XLBadgeManagedType ;


@interface XLXtifyOptions :NSObject
{
    NSString *xoAppKey;
    BOOL    xoLocationRequired ;
    BOOL    xoBackgroundLocationRequired ;
    BOOL    xoLogging ;
    BOOL    xoMultipleMarkets;
    XLBadgeManagedType xoManageBadge;
}
+ (XLXtifyOptions *)getXtifyOptions;
- (NSString *)getAppKey ;
- (BOOL) isLocationRequired;
- (BOOL) isBackgroundLocationRequired ;
- (BOOL) isLogging ;
- (BOOL) isMultipleMarkets;
- (XLBadgeManagedType)  getManageBadgeType;
- (void)xtLogMessage:(NSString *)header content:(NSString *)message, ...;
@end
