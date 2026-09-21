package com.focuslock

import android.accessibilityservice.AccessibilityService
import android.app.ActivityOptions
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import java.util.concurrent.ConcurrentHashMap

class FocusAccessibilityService : AccessibilityService() {

    private val appNameCache = ConcurrentHashMap<String, String>()

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val eventPkg = event.packageName?.toString() ?: ""
        val ownPkg = packageName

        // Ignore our own app, launcher, systemui, quicksearchbox, etc.
        if (eventPkg.isEmpty() || eventPkg == ownPkg || FocusSessionManager.isSystemOrLauncherPackage(this, eventPkg)) return

        // 1. FAST CHECK: check eventPkg directly
        // When a user taps an icon or launches an app, eventPkg is the exact target package (e.g. com.android.chrome).
        var blockedPkg: String? = null
        if (FocusSessionManager.isAppBlocked(this, eventPkg)) {
            blockedPkg = eventPkg
        } else {
            // Fallback: check window root ONLY if eventPkg wasn't blocked
            try {
                val windowPkg = rootInActiveWindow?.packageName?.toString()
                if (!windowPkg.isNullOrEmpty() && windowPkg != ownPkg && FocusSessionManager.isAppBlocked(this, windowPkg)) {
                    blockedPkg = windowPkg
                }
            } catch (_: Exception) {
                // Ignore window query exceptions
            }
        }

        val targetPkg = blockedPkg ?: return

        Log.d("FocusAccessibility", "App blocked instantly: $targetPkg -> Launching BlockingActivity")

        // Record distraction attempt (internally debounced & deduplicated)
        FocusSessionManager.recordDistractionAttempt(this, targetPkg)

        // Resolve app title (cached for instant 0ms retrieval)
        val appName = appNameCache.getOrPut(targetPkg) {
            try {
                val pm = packageManager
                val appInfo = pm.getApplicationInfo(targetPkg, 0)
                pm.getApplicationLabel(appInfo).toString()
            } catch (_: Exception) {
                targetPkg.substringAfterLast('.').replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
            }
        }

        // Launch full-screen BlockingActivity overlay IMMEDIATELY over the blocked app
        val intent = Intent(this, BlockingActivity::class.java).apply {
            putExtra(BlockingActivity.EXTRA_BLOCKED_APP_NAME, appName)
            putExtra(BlockingActivity.EXTRA_BLOCKED_PKG, targetPkg)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_NO_ANIMATION
        }

        val options = ActivityOptions.makeCustomAnimation(this, 0, 0)
        startActivity(intent, options.toBundle())
    }

    override fun onInterrupt() {
    }
}