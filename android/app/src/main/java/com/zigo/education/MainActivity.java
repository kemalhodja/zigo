package com.zigo.education;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.zigo.education.billing.ZigoPlayBillingPlugin;
import com.zigo.education.NativeVideoCompressorPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(ZigoPlayBillingPlugin.class);
    registerPlugin(NativeVideoCompressorPlugin.class);
    super.onCreate(savedInstanceState);

    CookieManager cookieManager = CookieManager.getInstance();
    cookieManager.setAcceptCookie(true);

    try {
      WebView webView = this.getBridge().getWebView();
      if (webView != null) {
        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // Cache statikleri diskten anında çeksin (ağ gecikmesini sıfırlar)
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        // Donanım hızlandırmalı pürüzsüz kaydırma
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
      }
    } catch (Exception ignored) {
    }
  }

  @Override
  public void onPause() {
    CookieManager.getInstance().flush();
    super.onPause();
  }
}
