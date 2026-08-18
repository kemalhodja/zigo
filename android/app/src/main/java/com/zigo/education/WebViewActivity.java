package com.zigo.education;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.net.http.SslError;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import androidx.appcompat.app.AppCompatActivity;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

public class WebViewActivity extends AppCompatActivity {

    private static final String TAG = "WEBVIEW_ERROR";
    private static final String TARGET_URL = "https://zigo-kohl.vercel.app/";

    private WebView webView;
    private LinearLayout errorLayout;
    private Button retryButton;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_webview);

        webView = findViewById(R.id.webView);
        errorLayout = findViewById(R.id.errorLayout);
        retryButton = findViewById(R.id.retryButton);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        // İhtiyaç halinde CORS ve mixed content engellerini teşhis için:
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                errorLayout.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
            }

            // API 23+ Hata Yakalama
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    Log.e(TAG, "onReceivedError (API 23+): URL: " + request.getUrl() + 
                              " | Code: " + error.getErrorCode() + 
                              " | Description: " + error.getDescription());
                    showErrorLayout();
                }
            }

            // API 23 Öncesi Hata Yakalama
            @SuppressWarnings("deprecation")
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                Log.e(TAG, "onReceivedError (Legacy): URL: " + failingUrl + 
                          " | Code: " + errorCode + 
                          " | Description: " + description);
                showErrorLayout();
            }

            // HTTP Seviyesindeki Hatalar (404, 500 vb.)
            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request.isForMainFrame()) {
                    Log.e(TAG, "onReceivedHttpError: URL: " + request.getUrl() + 
                              " | StatusCode: " + errorResponse.getStatusCode() + 
                              " | Reason: " + errorResponse.getReasonPhrase());
                    // HTTP hatalarında her zaman error layout göstermeyebiliriz, tercihinize bağlı.
                }
            }

            // SSL Hataları
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                Log.e(TAG, "onReceivedSslError: URL: " + error.getUrl() + 
                          " | PrimaryError: " + error.getPrimaryError() + 
                          " | String: " + error.toString());
                
                handler.cancel();
                showErrorLayout();
            }
        });

        retryButton.setOnClickListener(v -> {
            errorLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            performHealthCheckAndLoad();
        });

        // İlk yüklemeden önce health-check
        performHealthCheckAndLoad();
    }

    private void performHealthCheckAndLoad() {
        new Thread(() -> {
            try {
                Log.i(TAG, "HealthCheck: İstek atılıyor -> " + TARGET_URL);
                URL url = new URL(TARGET_URL);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("HEAD");
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                
                int responseCode = connection.getResponseCode();
                Log.i(TAG, "HealthCheck: Response Code = " + responseCode);
                
                connection.disconnect();
            } catch (IOException e) {
                Log.e(TAG, "HealthCheck: Başarısız! " + e.getMessage(), e);
            }

            // Ağ kontrolü bitsin bitmesin webview yüklemeyi dener
            runOnUiThread(() -> webView.loadUrl(TARGET_URL));
        }).start();
    }

    private void showErrorLayout() {
        webView.setVisibility(View.GONE);
        errorLayout.setVisibility(View.VISIBLE);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
