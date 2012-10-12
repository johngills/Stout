package com.gills.stout;

import android.os.Bundle;
import org.apache.cordova.*;
import android.app.Activity;


public class BeerActivity extends DroidGap {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www/index.html");
    }


}
