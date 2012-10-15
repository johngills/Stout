package com.gills.stout;

import android.os.Bundle;
import org.apache.cordova.*;
import android.app.Activity;
import android.content.Intent;


public class BeerActivity extends DroidGap {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        final Intent intent = new Intent("android.intent.action.MAIN");
        final String args=intent.getDataString();
        if(args == null)
        {
          super.loadUrl("file:///android_asset/www/index.html");
        } else
        {
          super.loadUrl("file:///android_asset/www/index.html?args=" + args.split("//")[1]);
        }
    }


}
