package com.focuslock

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class FocusAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val eventPkg = event.packageName?.toString()
        val windowPkg = try {
            rootInActiveWindow?.packageName?.toString()
        } catch (e: Exception) {
            null
        }

        val pkgToCheck = windowPkg ?: eventPkg ?: return

        if (FocusSessionManager.isAppBlocked(this, pkgToCheck)) {
            Log.d("FocusAccessibility", "App blocked: $pkgToCheck -> Executing HOME & BlockingActivity")

            // 1. Immediately send user back to Home screen
            performGlobalAction(GLOBAL_ACTION_HOME)

            // 2. Fetch app title for display
            val appName = try {
                val pm = packageManager
                val appInfo = pm.getApplicationInfo(pkgToCheck, 0)
                pm.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                pkgToCheck
            }

            // 3. Launch full-screen BlockingActivity overlay
            val intent = Intent(this, BlockingActivity::class.java).apply {
                putExtra(BlockingActivity.EXTRA_BLOCKED_APP_NAME, appName)
                putExtra(BlockingActivity.EXTRA_BLOCKED_PKG, pkgToCheck)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivity(intent)
        }
    }

    override fun onInterrupt() {
    }
}