package com.focuslock

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class FocusDatabaseHelper(context: Context) :
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "focuslock_db.db"
        private const val DATABASE_VERSION = 3

        const val TABLE_SESSIONS = "sessions"
        const val COLUMN_SESSION_ID = "id"
        const val COLUMN_TITLE = "title"
        const val COLUMN_START_TIME = "start_time"
        const val COLUMN_END_TIME = "end_time"
        const val COLUMN_DURATION_MINUTES = "duration_minutes"
        const val COLUMN_ACTUAL_MINUTES = "actual_minutes"
        const val COLUMN_SCORE = "score"
        const val COLUMN_BLOCKED_ATTEMPTS = "blocked_attempts"
        const val COLUMN_STRICT_MODE = "strict_mode"
        const val COLUMN_BLOCKED_APPS = "blocked_apps"
        const val COLUMN_ALLOWED_APPS = "allowed_apps"
        const val COLUMN_SESSION_PIN = "session_pin"
        const val COLUMN_IS_ACTIVE = "is_active"
        const val COLUMN_STATUS = "status"

        const val TABLE_DISTRACTIONS = "distraction_attempts"
        const val COLUMN_DISTRACTION_ID = "id"
        const val COLUMN_DISTRACTION_SESSION_ID = "session_id"
        const val COLUMN_DISTRACTION_PKG = "package_name"
        const val COLUMN_DISTRACTION_TIMESTAMP = "timestamp"

        const val TABLE_META = "user_meta"
        const val COLUMN_KEY = "key_name"
        const val COLUMN_VALUE = "val_value"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createSessionsTable = """
            CREATE TABLE $TABLE_SESSIONS (
                $COLUMN_SESSION_ID TEXT PRIMARY KEY,
                $COLUMN_TITLE TEXT,
                $COLUMN_START_TIME INTEGER,
                $COLUMN_END_TIME INTEGER,
                $COLUMN_DURATION_MINUTES INTEGER,
                $COLUMN_ACTUAL_MINUTES INTEGER DEFAULT 0,
                $COLUMN_SCORE INTEGER DEFAULT 100,
                $COLUMN_BLOCKED_ATTEMPTS INTEGER DEFAULT 0,
                $COLUMN_STRICT_MODE INTEGER,
                $COLUMN_BLOCKED_APPS TEXT,
                $COLUMN_ALLOWED_APPS TEXT,
                $COLUMN_SESSION_PIN TEXT,
                $COLUMN_IS_ACTIVE INTEGER,
                $COLUMN_STATUS TEXT
            )
        """.trimIndent()

        val createDistractionsTable = """
            CREATE TABLE $TABLE_DISTRACTIONS (
                $COLUMN_DISTRACTION_ID TEXT PRIMARY KEY,
                $COLUMN_DISTRACTION_SESSION_ID TEXT NOT NULL,
                $COLUMN_DISTRACTION_PKG TEXT NOT NULL,
                $COLUMN_DISTRACTION_TIMESTAMP INTEGER NOT NULL
            )
        """.trimIndent()

        val createMetaTable = """
            CREATE TABLE $TABLE_META (
                $COLUMN_KEY TEXT PRIMARY KEY,
                $COLUMN_VALUE TEXT
            )
        """.trimIndent()

        db.execSQL(createSessionsTable)
        db.execSQL(createDistractionsTable)
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_distraction_session ON $TABLE_DISTRACTIONS ($COLUMN_DISTRACTION_SESSION_ID)")
        db.execSQL(createMetaTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            try {
                db.execSQL("ALTER TABLE $TABLE_SESSIONS ADD COLUMN $COLUMN_SESSION_PIN TEXT")
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        if (oldVersion < 3) {
            try {
                db.execSQL("ALTER TABLE $TABLE_SESSIONS ADD COLUMN $COLUMN_ACTUAL_MINUTES INTEGER DEFAULT 0")
            } catch (e: Exception) {
                e.printStackTrace()
            }
            try {
                db.execSQL("ALTER TABLE $TABLE_SESSIONS ADD COLUMN $COLUMN_SCORE INTEGER DEFAULT 100")
            } catch (e: Exception) {
                e.printStackTrace()
            }
            try {
                db.execSQL("ALTER TABLE $TABLE_SESSIONS ADD COLUMN $COLUMN_BLOCKED_ATTEMPTS INTEGER DEFAULT 0")
            } catch (e: Exception) {
                e.printStackTrace()
            }
            try {
                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS $TABLE_DISTRACTIONS (
                        $COLUMN_DISTRACTION_ID TEXT PRIMARY KEY,
                        $COLUMN_DISTRACTION_SESSION_ID TEXT NOT NULL,
                        $COLUMN_DISTRACTION_PKG TEXT NOT NULL,
                        $COLUMN_DISTRACTION_TIMESTAMP INTEGER NOT NULL
                    )
                """.trimIndent())
                db.execSQL("CREATE INDEX IF NOT EXISTS idx_distraction_session ON $TABLE_DISTRACTIONS ($COLUMN_DISTRACTION_SESSION_ID)")
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun insertOrUpdateSession(
        id: String,
        title: String,
        startTime: Long,
        endTime: Long,
        durationMinutes: Int,
        strictMode: Boolean,
        blockedApps: Set<String>,
        allowedApps: Set<String>,
        sessionPin: String,
        isActive: Boolean,
        status: String,
        actualMinutes: Int = 0,
        score: Int = 100,
        blockedAttempts: Int = 0
    ) {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_SESSION_ID, id)
            put(COLUMN_TITLE, title)
            put(COLUMN_START_TIME, startTime)
            put(COLUMN_END_TIME, endTime)
            put(COLUMN_DURATION_MINUTES, durationMinutes)
            put(COLUMN_ACTUAL_MINUTES, actualMinutes)
            put(COLUMN_SCORE, score)
            put(COLUMN_BLOCKED_ATTEMPTS, blockedAttempts)
            put(COLUMN_STRICT_MODE, if (strictMode) 1 else 0)

            val blockedArr = JSONArray()
            blockedApps.forEach { blockedArr.put(it) }
            put(COLUMN_BLOCKED_APPS, blockedArr.toString())

            val allowedArr = JSONArray()
            allowedApps.forEach { allowedArr.put(it) }
            put(COLUMN_ALLOWED_APPS, allowedArr.toString())

            put(COLUMN_SESSION_PIN, sessionPin)
            put(COLUMN_IS_ACTIVE, if (isActive) 1 else 0)
            put(COLUMN_STATUS, status)
        }
        db.insertWithOnConflict(TABLE_SESSIONS, null, values, SQLiteDatabase.CONFLICT_REPLACE)
    }

    fun markSessionCompleted(
        id: String,
        status: String = "completed",
        actualMinutes: Int = -1,
        score: Int = -1,
        blockedAttempts: Int = -1
    ) {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_IS_ACTIVE, 0)
            put(COLUMN_STATUS, status)
            if (actualMinutes >= 0) {
                put(COLUMN_ACTUAL_MINUTES, actualMinutes)
            }
            if (score >= 0) {
                put(COLUMN_SCORE, score)
            }
            if (blockedAttempts >= 0) {
                put(COLUMN_BLOCKED_ATTEMPTS, blockedAttempts)
            }
        }
        db.update(TABLE_SESSIONS, values, "$COLUMN_SESSION_ID = ?", arrayOf(id))
    }

    fun recordDistractionAttempt(
        sessionId: String,
        packageName: String,
        timestamp: Long = System.currentTimeMillis()
    ): String {
        val db = writableDatabase
        val attemptId = java.util.UUID.randomUUID().toString()
        val values = ContentValues().apply {
            put(COLUMN_DISTRACTION_ID, attemptId)
            put(COLUMN_DISTRACTION_SESSION_ID, sessionId)
            put(COLUMN_DISTRACTION_PKG, packageName)
            put(COLUMN_DISTRACTION_TIMESTAMP, timestamp)
        }
        db.insert(TABLE_DISTRACTIONS, null, values)

        // Increment blocked_attempts count on session
        try {
            db.execSQL(
                "UPDATE $TABLE_SESSIONS SET $COLUMN_BLOCKED_ATTEMPTS = $COLUMN_BLOCKED_ATTEMPTS + 1 WHERE $COLUMN_SESSION_ID = ?",
                arrayOf(sessionId)
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return attemptId
    }

    fun getDistractionCountForSession(sessionId: String): Int {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT COUNT(*) FROM $TABLE_DISTRACTIONS WHERE $COLUMN_DISTRACTION_SESSION_ID = ?",
            arrayOf(sessionId)
        )
        cursor.use {
            if (it.moveToFirst()) {
                return it.getInt(0)
            }
        }
        return 0
    }

    fun getDistractionSummaryForSession(sessionId: String): List<Map<String, Any>> {
        val list = mutableListOf<Map<String, Any>>()
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT $COLUMN_DISTRACTION_PKG, COUNT(*) as count FROM $TABLE_DISTRACTIONS WHERE $COLUMN_DISTRACTION_SESSION_ID = ? GROUP BY $COLUMN_DISTRACTION_PKG ORDER BY count DESC",
            arrayOf(sessionId)
        )
        cursor.use {
            while (it.moveToNext()) {
                val map = mutableMapOf<String, Any>()
                map["packageName"] = it.getString(0)
                map["count"] = it.getInt(1)
                list.add(map)
            }
        }
        return list
    }

    fun getTodayDistractionsCount(): Int {
        val cal = java.util.Calendar.getInstance().apply {
            set(java.util.Calendar.HOUR_OF_DAY, 0)
            set(java.util.Calendar.MINUTE, 0)
            set(java.util.Calendar.SECOND, 0)
            set(java.util.Calendar.MILLISECOND, 0)
        }
        val startOfDay = cal.timeInMillis
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT COUNT(*) FROM $TABLE_DISTRACTIONS WHERE $COLUMN_DISTRACTION_TIMESTAMP >= ?",
            arrayOf(startOfDay.toString())
        )
        cursor.use {
            if (it.moveToFirst()) {
                return it.getInt(0)
            }
        }
        return 0
    }

    fun getAllSessions(): List<Map<String, Any>> {
        val list = mutableListOf<Map<String, Any>>()
        val db = readableDatabase
        val cursor = db.query(TABLE_SESSIONS, null, null, null, null, null, "$COLUMN_START_TIME DESC")
        cursor.use {
            while (it.moveToNext()) {
                val map = mutableMapOf<String, Any>()
                val duration = it.getInt(it.getColumnIndexOrThrow(COLUMN_DURATION_MINUTES))
                val actualCol = it.getColumnIndex(COLUMN_ACTUAL_MINUTES)
                val actual = if (actualCol >= 0) it.getInt(actualCol) else duration
                val scoreCol = it.getColumnIndex(COLUMN_SCORE)
                val score = if (scoreCol >= 0) it.getInt(scoreCol) else 100
                val blockedCol = it.getColumnIndex(COLUMN_BLOCKED_ATTEMPTS)
                val blocked = if (blockedCol >= 0) it.getInt(blockedCol) else 0

                map["id"] = it.getString(it.getColumnIndexOrThrow(COLUMN_SESSION_ID))
                map["title"] = it.getString(it.getColumnIndexOrThrow(COLUMN_TITLE)) ?: "Focus Session"
                map["start_time"] = it.getLong(it.getColumnIndexOrThrow(COLUMN_START_TIME))
                map["end_time"] = it.getLong(it.getColumnIndexOrThrow(COLUMN_END_TIME))
                map["duration_minutes"] = duration
                map["actual_minutes"] = if (actual > 0) actual else duration
                map["score"] = score
                map["blocked_attempts"] = blocked
                map["strict_mode"] = it.getInt(it.getColumnIndexOrThrow(COLUMN_STRICT_MODE)) == 1
                map["status"] = it.getString(it.getColumnIndexOrThrow(COLUMN_STATUS)) ?: "completed"
                list.add(map)
            }
        }
        return list
    }

    fun getMetaValue(key: String): String? {
        val db = readableDatabase
        val cursor = db.query(TABLE_META, arrayOf(COLUMN_VALUE), "$COLUMN_KEY = ?", arrayOf(key), null, null, null)
        cursor.use {
            if (it.moveToFirst()) {
                return it.getString(it.getColumnIndexOrThrow(COLUMN_VALUE))
            }
        }
        return null
    }

    fun setMetaValue(key: String, value: String) {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_KEY, key)
            put(COLUMN_VALUE, value)
        }
        db.insertWithOnConflict(TABLE_META, null, values, SQLiteDatabase.CONFLICT_REPLACE)
    }

    fun getCompletedSessionsCount(): Int {
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT COUNT(*) FROM $TABLE_SESSIONS WHERE $COLUMN_STATUS = 'completed'", null)
        cursor.use {
            if (it.moveToFirst()) {
                return it.getInt(0)
            }
        }
        return 0
    }

    fun getTotalFocusMinutes(): Int {
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT SUM($COLUMN_DURATION_MINUTES) FROM $TABLE_SESSIONS WHERE $COLUMN_STATUS = 'completed'", null)
        cursor.use {
            if (it.moveToFirst()) {
                return it.getInt(0)
            }
        }
        return 0
    }
}
