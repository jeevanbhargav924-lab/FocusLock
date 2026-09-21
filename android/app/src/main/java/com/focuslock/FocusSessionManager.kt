package com.focuslock

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

data class FocusSession(
    val sessionId: String,
    val title: String,
    val startTime: Long,
    val endTime: Long,
    val durationMinutes: Int,
    val strictMode: Boolean,
    val blockedApps: Set<String>,
    val allowedApps: Set<String>,
    val sessionPin: String,
    var isActive: Boolean
)

object FocusSessionManager {

    private const val PREFS_NAME = "focuslock_session_prefs"
    private const val KEY_ACTIVE_SESSION = "active_session_data"
    private const val KEY_DEFAULT_BLOCKED_APPS = "default_blocked_apps"
    private const val KEY_DAILY_CHANGES_COUNT = "daily_changes_count"
    private const val KEY_LAST_CHANGE_DATE = "last_change_date"
    private const val KEY_SECURITY_PASSCODE = "security_passcode"
    private const val KEY_MAX_DAILY_CHANGES = "max_daily_changes"
    private const val KEY_IS_LIMIT_LOCKED = "is_limit_locked"
    private const val DEFAULT_MAX_DAILY_CHANGES = 5

    private val SYSTEM_EXCLUDED_PACKAGES = setOf(
        "com.android.systemui",
        "com.android.settings",
        "com.google.android.googlequicksearchbox", // Google App / Home Screen Search Bar / Assistant
        "com.google.android.apps.nexuslauncher",   // Pixel Launcher
        "com.android.launcher",
        "com.android.launcher3",
        "com.sec.android.app.launcher",            // Samsung One UI Home
        "com.miui.home",                           // Xiaomi MIUI / HyperOS Launcher
        "com.huawei.android.launcher",             // Huawei Launcher
        "com.oppo.launcher",                       // Oppo Launcher
        "com.coloros.launcher",                    // ColorOS Launcher
        "com.oneplus.launcher",                    // OnePlus Launcher
        "com.motorola.launcher3",                  // Motorola Launcher
        "com.transsion.launcher",                  // Tecno/Infinix Launcher
        "com.google.android.inputmethod.latin",    // Gboard
        "com.sec.android.inputmethod",             // Samsung Keyboard
        "com.google.android.permissioncontroller",
        "com.android.permissioncontroller",
        "com.google.android.packageinstaller",
        "com.android.packageinstaller",
        "com.google.android.dialer",               // Phone calls
        "com.android.dialer",
        "com.android.phone",
        "com.android.server.telecom",
        "com.samsung.android.dialer",
        "com.android.emergency",
        "android"
    )

    fun getDefaultLauncherPackage(context: Context): String? {
        return try {
            val intent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
            }
            val resolveInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.resolveActivity(intent, PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY.toLong()))
            } else {
                context.packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
            }
            resolveInfo?.activityInfo?.packageName
        } catch (_: Exception) {
            null
        }
    }

    fun isSystemOrLauncherPackage(context: Context, packageName: String): Boolean {
        val pkgLower = packageName.lowercase()
        val ownPkg = context.packageName.lowercase()

        if (pkgLower == ownPkg) return true
        if (SYSTEM_EXCLUDED_PACKAGES.contains(pkgLower)) return true
        if (pkgLower.contains("launcher") ||
            pkgLower.contains("home") ||
            pkgLower.contains("systemui") ||
            pkgLower.contains("inputmethod") ||
            pkgLower.contains("quicksearchbox") ||
            pkgLower.contains("dialer") ||
            pkgLower.contains("telecom") ||
            pkgLower.contains("emergency") ||
            pkgLower.contains("permissioncontroller") ||
            pkgLower.contains("packageinstaller")) return true

        val defaultLauncher = getDefaultLauncherPackage(context)?.lowercase()
        if (defaultLauncher != null && pkgLower == defaultLauncher) return true

        return false
    }

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private fun getTodayDateString(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        return sdf.format(Date())
    }

    fun getMaxDailyChanges(context: Context): Int {
        val db = FocusDatabaseHelper(context)
        val valStr = db.getMetaValue(KEY_MAX_DAILY_CHANGES)
        if (valStr != null) {
            return valStr.toIntOrNull() ?: DEFAULT_MAX_DAILY_CHANGES
        }
        val prefs = getPrefs(context)
        return prefs.getInt(KEY_MAX_DAILY_CHANGES, DEFAULT_MAX_DAILY_CHANGES)
    }

    fun setMaxDailyChanges(context: Context, limit: Int, lock: Boolean = false) {
        val db = FocusDatabaseHelper(context)
        db.setMetaValue(KEY_MAX_DAILY_CHANGES, limit.toString())
        if (lock) {
            db.setMetaValue(KEY_IS_LIMIT_LOCKED, "1")
        }
        val prefs = getPrefs(context)
        prefs.edit().putInt(KEY_MAX_DAILY_CHANGES, limit).putBoolean(KEY_IS_LIMIT_LOCKED, lock).apply()
        Log.d("FocusSessionManager", "setMaxDailyChanges: limit=$limit, lock=$lock")
    }

    fun isDailyLimitLocked(context: Context): Boolean {
        val db = FocusDatabaseHelper(context)
        val valStr = db.getMetaValue(KEY_IS_LIMIT_LOCKED)
        if (valStr == "1") return true
        val prefs = getPrefs(context)
        return prefs.getBoolean(KEY_IS_LIMIT_LOCKED, false)
    }

    fun getDailyChangesRemaining(context: Context): Int {
        val maxChanges = getMaxDailyChanges(context)

        // -1 represents Unlimited
        if (maxChanges == -1) return 99999

        // 0 represents Strictly 0 Emergency Ends Allowed
        if (maxChanges == 0) return 0

        val db = FocusDatabaseHelper(context)
        val prefs = getPrefs(context)
        val today = getTodayDateString()

        var lastDate = db.getMetaValue(KEY_LAST_CHANGE_DATE)
        if (lastDate == null) {
            lastDate = prefs.getString(KEY_LAST_CHANGE_DATE, "")
        }

        if (lastDate != today) {
            db.setMetaValue(KEY_LAST_CHANGE_DATE, today)
            db.setMetaValue(KEY_DAILY_CHANGES_COUNT, "0")
            prefs.edit().putString(KEY_LAST_CHANGE_DATE, today).putInt(KEY_DAILY_CHANGES_COUNT, 0).apply()
            return maxChanges
        }

        val usedStr = db.getMetaValue(KEY_DAILY_CHANGES_COUNT)
        val used = usedStr?.toIntOrNull() ?: prefs.getInt(KEY_DAILY_CHANGES_COUNT, 0)
        val remaining = (maxChanges - used).coerceAtLeast(0)
        Log.d("FocusSessionManager", "getDailyChangesRemaining: max=$maxChanges, used=$used, remaining=$remaining")
        return remaining
    }

    fun recordDailyChange(context: Context): Boolean {
        val maxChanges = getMaxDailyChanges(context)
        if (maxChanges == -1) return true // Unlimited
        if (maxChanges == 0) return false // 0 allowed

        val remaining = getDailyChangesRemaining(context)
        if (remaining <= 0) return false

        val db = FocusDatabaseHelper(context)
        val prefs = getPrefs(context)
        val today = getTodayDateString()

        val usedStr = db.getMetaValue(KEY_DAILY_CHANGES_COUNT)
        val used = usedStr?.toIntOrNull() ?: prefs.getInt(KEY_DAILY_CHANGES_COUNT, 0)
        val newUsed = used + 1

        db.setMetaValue(KEY_LAST_CHANGE_DATE, today)
        db.setMetaValue(KEY_DAILY_CHANGES_COUNT, newUsed.toString())

        prefs.edit().putString(KEY_LAST_CHANGE_DATE, today).putInt(KEY_DAILY_CHANGES_COUNT, newUsed).apply()
        Log.d("FocusSessionManager", "recordDailyChange: max=$maxChanges, newUsed=$newUsed, remaining=${maxChanges - newUsed}")
        return true
    }

    fun savePasscode(context: Context, passcode: String) {
        val db = FocusDatabaseHelper(context)
        db.setMetaValue(KEY_SECURITY_PASSCODE, passcode)

        val prefs = getPrefs(context)
        prefs.edit().putString(KEY_SECURITY_PASSCODE, passcode).apply()
    }

    fun verifyPasscode(context: Context, passcode: String): Boolean {
        // Check active session PIN first if available
        val session = getActiveSession(context)
        if (session != null && session.sessionPin.isNotEmpty()) {
            return session.sessionPin == passcode
        }

        val db = FocusDatabaseHelper(context)
        val savedDb = db.getMetaValue(KEY_SECURITY_PASSCODE)
        if (!savedDb.isNullOrEmpty()) {
            return savedDb == passcode
        }

        val prefs = getPrefs(context)
        val savedPrefs = prefs.getString(KEY_SECURITY_PASSCODE, "")
        return savedPrefs.isNullOrEmpty() || savedPrefs == passcode
    }

    fun hasPasscode(context: Context): Boolean {
        val session = getActiveSession(context)
        if (session != null && session.sessionPin.isNotEmpty()) return true

        val db = FocusDatabaseHelper(context)
        val savedDb = db.getMetaValue(KEY_SECURITY_PASSCODE)
        if (!savedDb.isNullOrEmpty()) return true

        val prefs = getPrefs(context)
        val savedPrefs = prefs.getString(KEY_SECURITY_PASSCODE, "")
        return !savedPrefs.isNullOrEmpty()
    }

    fun startSession(
        context: Context,
        title: String = "Deep Focus Session",
        durationMinutes: Int,
        strictMode: Boolean,
        blockedApps: Set<String>,
        allowedApps: Set<String>,
        sessionPin: String = ""
    ): FocusSession {
        val now = System.currentTimeMillis()
        val durationMillis = durationMinutes * 60 * 1000L
        val endTime = now + durationMillis

        val cleanBlocked = blockedApps.filter { !isSystemOrLauncherPackage(context, it) }.toSet()
        val finalBlockedApps = if (cleanBlocked.isEmpty()) {
            getDefaultBlockedApps(context)
        } else {
            saveDefaultBlockedApps(context, cleanBlocked)
            cleanBlocked
        }

        val session = FocusSession(
            sessionId = UUID.randomUUID().toString(),
            title = if (title.isEmpty()) "Deep Focus Session" else title,
            startTime = now,
            endTime = endTime,
            durationMinutes = durationMinutes,
            strictMode = strictMode,
            blockedApps = finalBlockedApps,
            allowedApps = allowedApps,
            sessionPin = sessionPin,
            isActive = true
        )

        saveSession(context, session)
        if (sessionPin.isNotEmpty()) {
            savePasscode(context, sessionPin)
        }

        // Save to SQLite database
        val db = FocusDatabaseHelper(context)
        db.insertOrUpdateSession(
            id = session.sessionId,
            title = session.title,
            startTime = session.startTime,
            endTime = session.endTime,
            durationMinutes = session.durationMinutes,
            strictMode = session.strictMode,
            blockedApps = session.blockedApps,
            allowedApps = session.allowedApps,
            sessionPin = session.sessionPin,
            isActive = true,
            status = "active"
        )

        Log.d("FocusSessionManager", "Started focus session: ${session.sessionId}, title: ${session.title}, pin: ${session.sessionPin}")
        return session
    }

    @Volatile
    private var inMemoryActiveSession: FocusSession? = null

    fun saveSession(context: Context, session: FocusSession?) {
        inMemoryActiveSession = if (session?.isActive == true) session else null
        val prefs = getPrefs(context)
        if (session == null || !session.isActive) {
            prefs.edit().remove(KEY_ACTIVE_SESSION).apply()
            return
        }

        try {
            val json = JSONObject()
            json.put("sessionId", session.sessionId)
            json.put("title", session.title)
            json.put("startTime", session.startTime)
            json.put("endTime", session.endTime)
            json.put("durationMinutes", session.durationMinutes)
            json.put("strictMode", session.strictMode)

            val blockedArr = JSONArray()
            session.blockedApps.forEach { blockedArr.put(it) }
            json.put("blockedApps", blockedArr)

            val allowedArr = JSONArray()
            session.allowedApps.forEach { allowedArr.put(it) }
            json.put("allowedApps", allowedArr)

            json.put("sessionPin", session.sessionPin)
            json.put("isActive", session.isActive)

            prefs.edit().putString(KEY_ACTIVE_SESSION, json.toString()).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getActiveSession(context: Context): FocusSession? {
        val cached = inMemoryActiveSession
        val now = System.currentTimeMillis()
        if (cached != null) {
            if (now < cached.endTime && cached.isActive) {
                return cached
            } else {
                inMemoryActiveSession = null
            }
        }

        val prefs = getPrefs(context)
        val jsonStr = prefs.getString(KEY_ACTIVE_SESSION, null) ?: return null

        return try {
            val json = JSONObject(jsonStr)
            val endTime = json.optLong("endTime", 0L)

            if (now >= endTime) {
                inMemoryActiveSession = null
                val sessionId = json.optString("sessionId", "")
                if (sessionId.isNotEmpty()) {
                    val db = FocusDatabaseHelper(context)
                    db.markSessionCompleted(sessionId, "completed")
                }
                prefs.edit().remove(KEY_ACTIVE_SESSION).apply()
                null
            } else {
                val blockedApps = mutableSetOf<String>()
                val blockedArr = json.optJSONArray("blockedApps")
                if (blockedArr != null) {
                    for (i in 0 until blockedArr.length()) {
                        blockedApps.add(blockedArr.getString(i))
                    }
                }

                val allowedApps = mutableSetOf<String>()
                val allowedArr = json.optJSONArray("allowedApps")
                if (allowedArr != null) {
                    for (i in 0 until allowedArr.length()) {
                        allowedApps.add(allowedArr.getString(i))
                    }
                }

                val session = FocusSession(
                    sessionId = json.getString("sessionId"),
                    title = json.optString("title", "Deep Focus Session"),
                    startTime = json.getLong("startTime"),
                    endTime = endTime,
                    durationMinutes = json.getInt("durationMinutes"),
                    strictMode = json.getBoolean("strictMode"),
                    blockedApps = blockedApps,
                    allowedApps = allowedApps,
                    sessionPin = json.optString("sessionPin", ""),
                    isActive = json.getBoolean("isActive")
                )
                inMemoryActiveSession = session
                session
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // Debouncing state for distraction attempts
    private var lastBlockedPkg: String? = null
    private var lastBlockedTimestamp: Long = 0L
    private const val DEBOUNCE_WINDOW_MS = 2000L

    @Synchronized
    fun recordDistractionAttempt(context: Context, packageName: String): Boolean {
        val session = getActiveSession(context) ?: return false
        if (!session.isActive) return false

        val now = System.currentTimeMillis()
        if (packageName.equals(lastBlockedPkg, ignoreCase = true) && (now - lastBlockedTimestamp < DEBOUNCE_WINDOW_MS)) {
            Log.d("FocusSessionManager", "Debounced duplicate distraction event for: $packageName")
            return false
        }

        lastBlockedPkg = packageName
        lastBlockedTimestamp = now

        try {
            val db = FocusDatabaseHelper(context)
            db.recordDistractionAttempt(session.sessionId, packageName, now)
            Log.d("FocusSessionManager", "Recorded distraction attempt: session=${session.sessionId}, pkg=$packageName")
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    fun getActiveSessionDistractions(context: Context): Map<String, Any> {
        val session = getActiveSession(context)
        val result = mutableMapOf<String, Any>()
        if (session == null || !session.isActive) {
            result["totalCount"] = 0
            result["topApp"] = ""
            result["topAppCount"] = 0
            return result
        }

        val db = FocusDatabaseHelper(context)
        val totalCount = db.getDistractionCountForSession(session.sessionId)
        val summary = db.getDistractionSummaryForSession(session.sessionId)
        var topApp = ""
        var topAppCount = 0

        if (summary.isNotEmpty()) {
            val first = summary[0]
            val pkg = first["packageName"] as? String ?: ""
            topAppCount = first["count"] as? Int ?: 0
            topApp = try {
                val pm = context.packageManager
                val appInfo = pm.getApplicationInfo(pkg, 0)
                pm.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                pkg
            }
        }

        result["totalCount"] = totalCount
        result["topApp"] = topApp
        result["topAppCount"] = topAppCount
        return result
    }

    fun getSessionDistractions(context: Context, sessionId: String): Map<String, Any> {
        val db = FocusDatabaseHelper(context)
        val totalCount = db.getDistractionCountForSession(sessionId)
        val summary = db.getDistractionSummaryForSession(sessionId)
        val formattedSummary = mutableListOf<Map<String, Any>>()

        for (item in summary) {
            val pkg = item["packageName"] as? String ?: ""
            val count = item["count"] as? Int ?: 0
            val appName = try {
                val pm = context.packageManager
                val appInfo = pm.getApplicationInfo(pkg, 0)
                pm.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                pkg
            }
            formattedSummary.add(mapOf(
                "packageName" to pkg,
                "appName" to appName,
                "count" to count
            ))
        }

        return mapOf(
            "totalCount" to totalCount,
            "summary" to formattedSummary
        )
    }

    fun endSession(
        context: Context,
        status: String = "ended",
        actualMinutes: Int = -1,
        score: Int = -1,
        blockedAttempts: Int = -1
    ) {
        val prefs = getPrefs(context)
        val jsonStr = prefs.getString(KEY_ACTIVE_SESSION, null)
        if (jsonStr != null) {
            try {
                val json = JSONObject(jsonStr)
                val sessionId = json.optString("sessionId", "")
                if (sessionId.isNotEmpty()) {
                    val db = FocusDatabaseHelper(context)
                    val realBlocked = if (blockedAttempts >= 0) blockedAttempts else db.getDistractionCountForSession(sessionId)
                    db.markSessionCompleted(sessionId, status, actualMinutes, score, realBlocked)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        inMemoryActiveSession = null
        prefs.edit().remove(KEY_ACTIVE_SESSION).apply()
    }

    fun isAppBlocked(context: Context, packageName: String): Boolean {
        val session = getActiveSession(context) ?: return false
        if (!session.isActive) return false

        // 1. Guard check: System services, Google Search widget, and Launchers are NEVER blocked
        if (isSystemOrLauncherPackage(context, packageName)) {
            return false
        }

        val pkgLower = packageName.lowercase()

        // 2. Direct Package Match
        if (session.blockedApps.contains(packageName) || session.blockedApps.contains(pkgLower)) {
            return true
        }

        // 3. Keyword & Alias Match
        for (blocked in session.blockedApps) {
            val bLower = blocked.lowercase()
            if (bLower.contains("chrome") && pkgLower.contains("chrome")) return true
            if (bLower.contains("youtube") && pkgLower.contains("youtube")) return true
            if (bLower.contains("instagram") && pkgLower.contains("instagram")) return true
            if (bLower.contains("facebook") && pkgLower.contains("facebook")) return true
            if (bLower.contains("reddit") && pkgLower.contains("reddit")) return true
            if (bLower.contains("twitter") && pkgLower.contains("twitter")) return true
            if (bLower.contains("tiktok") && (pkgLower.contains("musically") || pkgLower.contains("tiktok"))) return true
        }

        // 4. Allowed Apps constraint (whitelist mode)
        if (session.allowedApps.isNotEmpty()) {
            val isAllowedDirect = session.allowedApps.contains(packageName) || session.allowedApps.contains(pkgLower)
            var isAllowedAlias = false
            if (!isAllowedDirect) {
                for (allowed in session.allowedApps) {
                    val aLower = allowed.lowercase()
                    if (aLower.contains("chrome") && pkgLower.contains("chrome")) isAllowedAlias = true
                    if (aLower.contains("youtube") && pkgLower.contains("youtube")) isAllowedAlias = true
                    if (aLower.contains("phone") && (pkgLower.contains("dialer") || pkgLower.contains("phone"))) isAllowedAlias = true
                    if (aLower.contains("map") && pkgLower.contains("map")) isAllowedAlias = true
                }
            }
            if (!isAllowedDirect && !isAllowedAlias) {
                return true
            }
        }

        return false
    }

    fun saveDefaultBlockedApps(context: Context, blockedApps: Set<String>) {
        val prefs = getPrefs(context)
        val jsonArr = JSONArray()
        blockedApps
            .filter { !isSystemOrLauncherPackage(context, it) }
            .forEach { jsonArr.put(it) }
        prefs.edit().putString(KEY_DEFAULT_BLOCKED_APPS, jsonArr.toString()).apply()
    }

    fun getDefaultBlockedApps(context: Context): Set<String> {
        val prefs = getPrefs(context)
        val jsonStr = prefs.getString(KEY_DEFAULT_BLOCKED_APPS, null)
        if (jsonStr != null) {
            try {
                val set = mutableSetOf<String>()
                val jsonArr = JSONArray(jsonStr)
                for (i in 0 until jsonArr.length()) {
                    val pkg = jsonArr.getString(i)
                    if (!isSystemOrLauncherPackage(context, pkg)) {
                        set.add(pkg)
                    }
                }
                if (set.isNotEmpty()) return set
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        return setOf(
            "com.instagram.android",
            "com.google.android.youtube",
            "com.reddit.frontpage",
            "com.zhiliaoapp.musically",
            "com.facebook.katana",
            "com.facebook.orca",
            "com.twitter.android",
            "com.android.chrome",
            "com.chrome.beta",
            "com.google.android.apps.chrome",
            "com.snapchat.android"
        )
    }

    fun getRemainingTimeFormatted(context: Context): String {
        val session = getActiveSession(context) ?: return "00:00:00"
        val remainingMillis = session.endTime - System.currentTimeMillis()
        if (remainingMillis <= 0) return "00:00:00"

        val seconds = (remainingMillis / 1000) % 60
        val minutes = (remainingMillis / (1000 * 60)) % 60
        val hours = remainingMillis / (1000 * 60 * 60)

        return String.format("%02d:%02d:%02d", hours, minutes, seconds)
    }
}
