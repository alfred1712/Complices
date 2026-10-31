package com.chispa.app;
import android.app.Activity;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
public class MainActivity extends Activity {
  private WebView web;
  private static final String APP_ASSET_PREFIX = "file:///android_asset/";

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    web = new WebView(this);
    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    // Needed to load the bundled HTML. Keep file-origin cross-access disabled.
    settings.setAllowFileAccess(true);
    settings.setAllowFileAccessFromFileURLs(false);
    settings.setAllowUniversalAccessFromFileURLs(false);
    settings.setAllowContentAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    web.setWebViewClient(new WebViewClient() {
      private boolean isAppAsset(String url) {
        Uri uri = Uri.parse(url);
        return "file".equals(uri.getScheme())
            && "/android_asset/index.html".equals(uri.getPath());
      }

      @Override
      public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return !isAppAsset(url);
      }

      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        return !isAppAsset(request.getUrl().toString());
      }
    });
    web.setWebChromeClient(new WebChromeClient());
    setContentView(web);
    web.loadUrl(APP_ASSET_PREFIX + "index.html?nueva=1");
  }
  @Override public void onConfigurationChanged(Configuration newConfig) { super.onConfigurationChanged(newConfig); if (web != null) { web.requestLayout(); web.invalidate(); } }
  @Override public void onBackPressed() { if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
