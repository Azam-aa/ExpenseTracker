package com.personal.daytodayexpenses;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Native WindowInsets listener pushing exact CSS safe area variables into the WebView
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());

            float density = getResources().getDisplayMetrics().density;
            int topDp = Math.round(systemBars.top / density);
            int bottomDp = Math.round(systemBars.bottom / density);
            int leftDp = Math.round(systemBars.left / density);
            int rightDp = Math.round(systemBars.right / density);
            int imeHeightDp = Math.round(ime.bottom / density);

            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null) {
                String js = String.format(
                    "javascript:(function() {" +
                    "  var root = document.documentElement;" +
                    "  root.style.setProperty('--safe-top', '%dpx');" +
                    "  root.style.setProperty('--safe-bottom', '%dpx');" +
                    "  root.style.setProperty('--safe-left', '%dpx');" +
                    "  root.style.setProperty('--safe-right', '%dpx');" +
                    "  root.style.setProperty('--kb-height', '%dpx');" +
                    "  window.dispatchEvent(new CustomEvent('native-insets-change', {" +
                    "    detail: { top: %d, bottom: %d, left: %d, right: %d, imeHeight: %d }" +
                    "  }));" +
                    "})();",
                    topDp, bottomDp, leftDp, rightDp, imeHeightDp,
                    topDp, bottomDp, leftDp, rightDp, imeHeightDp
                );
                webView.post(() -> webView.evaluateJavascript(js, null));
            }

            return windowInsets;
        });
    }
}
