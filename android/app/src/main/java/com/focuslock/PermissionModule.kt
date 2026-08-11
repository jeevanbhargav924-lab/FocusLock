package com.focuslock

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityManager
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.*

class PermissionModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "PermissionModule"

    private val PREFS_NAME = "focuslock_prefs"
    private val KEY_PERMISSIONS_COMPLETED = "permissions_completed"

    @ReactMethod
    fun canAuthenticateBiometric(promise: Promise) {
        try {
            val bm = BiometricManager.from(reactApplicationContext)
            val canAuth = bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK)
            promise.resolve(canAuth == BiometricManager.BIOMETRIC_SUCCESS)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun authenticateBiometric(promise: Promise) {
        val activity = reactApplicationContext.currentActivity as? FragmentActivity
        if (activity == null) {
            promise.resolve(false)
            return
        }

        activity.runOnUiThread {
            try {
                val executor = ContextCompat.getMainExecutor(activity)
                val biometricPrompt = BiometricPrompt(activity, executor,
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                            super.onAuthenticationSucceeded(result)
                            promise.resolve(true)
                        }

                        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                            super.onAuthenticationError(errorCode, errString)
                            promise.resolve(false)
                        }

                        override fun onAuthenticationFailed() {
                            super.onAuthenticationFailed()
                        }
                    })

                val promptInfo = BiometricPrompt.PromptInfo.Builder()
                    .setTitle("FocusLock Security 🔒")
                    .setSubtitle("Scan your fingerprint to authorize action")
                    .setNegativeButtonText("Cancel")
                    .build()

                biometricPrompt.authenticate(promptInfo)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun getMaxDailyChanges(promise: Promise) {
        try {
            val max = FocusSessionManager.getMaxDailyChanges(reactApplicationContext)
            promise.resolve(max)
        } catch (e: Exception) {
            promise.resolve(5)
        }
    }

    @ReactMethod
    fun setMaxDailyChanges(limit: Int, lock: Boolean, promise: Promise) {
        try {
            FocusSessionManager.setMaxDailyChanges(reactApplicationContext, limit, lock)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isDailyLimitLocked(promise: Promise) {
        try {
            val locked = FocusSessionManager.isDailyLimitLocked(reactApplicationContext)
            promise.resolve(locked)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getDailyChangesRemaining(promise: Promise) {
        try {
            val remaining = FocusSessionManager.getDailyChangesRemaining(reactApplicationContext)
            promise.resolve(remaining)
        } catch (e: Exception) {
            promise.resolve(5)
        }
    }

    @ReactMethod
    fun recordDailyChange(promise: Promise) {
        try {
            val success = FocusSessionManager.recordDailyChange(reactApplicationContext)
            promise.resolve(success)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun savePasscode(passcode: String, promise: Promise) {
        try {
            FocusSessionManager.savePasscode(reactApplicationContext, passcode)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun verifyPasscode(passcode: String, promise: Promise) {
        try {
            val verified = FocusSessionManager.verifyPasscode(reactApplicationContext, passcode)
            promise.resolve(verified)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun hasPasscode(promise: Promise) {
        try {
            val exists = FocusSessionManager.hasPasscode(reactApplicationContext)
            promise.resolve(exists)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun startFocusSession(
        title: String,
        durationMinutes: Int,
        strictMode: Boolean,
        blockedAppsArr: ReadableArray,
        allowedAppsArr: ReadableArray,
        sessionPin: String,
        promise: Promise
    ) {
        try {
            val blockedSet = mutableSetOf<String>()
            for (i in 0 until blockedAppsArr.size()) {
                blockedAppsArr.getString(i)?.let { blockedSet.add(it) }
            }

            val allowedSet = mutableSetOf<String>()
            for (i in 0 until allowedAppsArr.size()) {
                allowedAppsArr.getString(i)?.let { allowedSet.add(it) }
            }

            val session = FocusSessionManager.startSession(
                reactApplicationContext,
                title,
                durationMinutes,
                strictMode,
                blockedSet,
                allowedSet,
                sessionPin
            )

            // Start Foreground Service
            val intent = Intent(reactApplicationContext, FocusForegroundService::class.java).apply {
                action = FocusForegroundService.ACTION_START_SERVICE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }

            promise.resolve(session.sessionId)
        } catch (e: Exception) {
            promise.reject("ERR_START_SESSION", e.message)
        }
    }

    @ReactMethod
    fun stopFocusSession(promise: Promise) {
        try {
            FocusSessionManager.endSession(reactApplicationContext, "ended")
            val intent = Intent(reactApplicationContext, FocusForegroundService::class.java).apply {
                action = FocusForegroundService.ACTION_STOP_SERVICE
            }
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_STOP_SESSION", e.message)
        }
    }

    @ReactMethod
    fun completeFocusSession(promise: Promise) {
        try {
            FocusSessionManager.endSession(reactApplicationContext, "completed")
            val intent = Intent(reactApplicationContext, FocusForegroundService::class.java).apply {
                action = FocusForegroundService.ACTION_STOP_SERVICE
            }
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_COMPLETE_SESSION", e.message)
        }
    }

    @ReactMethod
    fun getActiveSession(promise: Promise) {
        try {
            val session = FocusSessionManager.getActiveSession(reactApplicationContext)
            if (session == null) {
                promise.resolve(null)
            } else {
                val map = WritableNativeMap().apply {
                    putString("sessionId", session.sessionId)
                    putString("title", session.title)
                    putDouble("startTime", session.startTime.toDouble())
                    putDouble("endTime", session.endTime.toDouble())
                    putInt("durationMinutes", session.durationMinutes)
                    putBoolean("strictMode", session.strictMode)
                    putBoolean("isActive", session.isActive)
                }
                promise.resolve(map)
            }
        } catch (e: Exception) {
            promise.reject("ERR_GET_SESSION", e.message)
        }
    }

    @ReactMethod
    fun getRemainingTime(promise: Promise) {
        try {
            val formatted = FocusSessionManager.getRemainingTimeFormatted(reactApplicationContext)
            promise.resolve(formatted)
        } catch (e: Exception) {
            promise.resolve("00:00:00")
        }
    }

    @ReactMethod
    fun getDatabaseStats(promise: Promise) {
        try {
            val db = FocusDatabaseHelper(reactApplicationContext)
            val completed = db.getCompletedSessionsCount()
            val totalMinutes = db.getTotalFocusMinutes()

            val map = WritableNativeMap().apply {
                putInt("completedSessions", completed)
                putInt("totalFocusMinutes", totalMinutes)
                putDouble("totalFocusHours", totalMinutes / 60.0)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("ERR_DB_STATS", e.message)
        }
    }

    @ReactMethod
    fun getNativeHistorySessions(promise: Promise) {
        try {
            val db = FocusDatabaseHelper(reactApplicationContext)
            val sessions = db.getAllSessions()
            val array = WritableNativeArray()
            for (s in sessions) {
                val map = WritableNativeMap()
                map.putString("id", s["id"] as String)
                map.putString("title", s["title"] as String)
                map.putDouble("start_time", (s["start_time"] as Long).toDouble())
                map.putDouble("end_time", (s["end_time"] as Long).toDouble())
                map.putInt("duration_minutes", s["duration_minutes"] as Int)
                map.putBoolean("strict_mode", s["strict_mode"] as Boolean)
                map.putString("status", s["status"] as String)
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("ERR_NATIVE_HISTORY", e.message)
        }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val mainIntent = Intent(Intent.ACTION_MAIN, null)
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER)
            val resolveInfos = pm.queryIntentActivities(mainIntent, 0)
            val appList = WritableNativeArray()
            val ownPkg = reactApplicationContext.packageName

            for (info in resolveInfos) {
                val pkg = info.activityInfo.packageName
                if (pkg == ownPkg) continue

                val appName = info.loadLabel(pm).toString()
                val isSystem = (info.activityInfo.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0

                val map = WritableNativeMap()
                map.putString("id", pkg)
                map.putString("name", appName)
                map.putString("packageName", pkg)
                map.putBoolean("isSystem", isSystem)
                appList.pushMap(map)
            }
            promise.resolve(appList)
        } catch (e: Exception) {
            promise.reject("ERR_GET_APPS", e.message)
        }
    }

    @ReactMethod
    fun setPermissionsCompleted(completed: Boolean) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putBoolean(KEY_PERMISSIONS_COMPLETED, completed).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun isPermissionsCompleted(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val completed = prefs.getBoolean(KEY_PERMISSIONS_COMPLETED, false)
            promise.resolve(completed)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun hasAccessibilityPermission(promise: Promise) {
        try {
            val am = reactApplicationContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
            val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
            val pkgName = reactApplicationContext.packageName
            for (service in enabledServices) {
                if (service.resolveInfo.serviceInfo.packageName == pkgName) {
                    promise.resolve(true)
                    return
                }
            }
            promise.resolve(false)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openUsageAccessSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun hasUsagePermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactApplicationContext.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactApplicationContext.packageName
                )
            }
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openOverlaySettings() {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${reactApplicationContext.packageName}")
        )
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun openBatteryOptimizationSettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:${reactApplicationContext.packageName}")
                )
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                reactApplicationContext.startActivity(intent)
            } else {
                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                reactApplicationContext.startActivity(intent)
            }
        } catch (e: Exception) {
            try {
                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                reactApplicationContext.startActivity(intent)
            } catch (ex: Exception) {
                val intent = Intent(Settings.ACTION_SETTINGS)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                reactApplicationContext.startActivity(intent)
            }
        }
    }

    @ReactMethod
    fun hasBatteryOptimizationPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
                promise.resolve(pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName))
            } catch (e: Exception) {
                promise.resolve(false)
            }
        } else {
            promise.resolve(true)
        }
    }
}