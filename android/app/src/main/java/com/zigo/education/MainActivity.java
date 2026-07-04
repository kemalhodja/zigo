package com.zigo.education;

import android.os.Bundle;
import android.webkit.CookieManager;

import com.getcapacitor.BridgeActivity;
import com.zigo.education.billing.ZigoPlayBillingPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(ZigoPlayBillingPlugin.class);
    super.onCreate(savedInstanceState);

    CookieManager cookieManager = CookieManager.getInstance();
    cookieManager.setAcceptCookie(true);
  }

  @Override
  public void onPause() {
    CookieManager.getInstance().flush();
    super.onPause();
  }
}
