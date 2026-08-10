package com.focuslock

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.Window
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class BlockingActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_BLOCKED_APP_NAME = "EXTRA_BLOCKED_APP_NAME"
        const val EXTRA_BLOCKED_PKG = "EXTRA_BLOCKED_PKG"
    }

    private lateinit var remainingTimeTv: TextView
    private val handler = Handler(Looper.getMainLooper())
    private val updateRunnable = object : Runnable {
        override fun run() {
            val session = FocusSessionManager.getActiveSession(this@BlockingActivity)
            if (session == null || !session.isActive) {
                finish()
            } else {
                remainingTimeTv.text = FocusSessionManager.getRemainingTimeFormatted(this@BlockingActivity)
                handler.postDelayed(this, 1000)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make Fullscreen
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )

        val appName = intent.getStringExtra(EXTRA_BLOCKED_APP_NAME) ?: "This App"
        val activeSession = FocusSessionManager.getActiveSession(this)
        val sessionGoal = activeSession?.title.takeIf { !it.isNullOrBlank() } ?: "Deep Focus Session"
        val randomQuote = MotivationQuotes.getRandomQuote()

        // Root Container
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0D1117"))
            gravity = Gravity.CENTER
            setPadding(40, 48, 40, 48)
        }

        // Header Icon 🔒
        val iconTv = TextView(this).apply {
            text = "🔒"
            textSize = 44f
            gravity = Gravity.CENTER
        }
        rootLayout.addView(iconTv)

        // Access Restricted Title
        val titleTv = TextView(this).apply {
            text = "ACCESS RESTRICTED"
            setTextColor(Color.parseColor("#FF6B6B"))
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            letterSpacing = 0.1f
            setPadding(0, 16, 0, 4)
        }
        rootLayout.addView(titleTv)

        // App Blocked Subtitle
        val subTv = TextView(this).apply {
            text = "$appName is Locked"
            setTextColor(Color.WHITE)
            textSize = 24f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 20)
        }
        rootLayout.addView(subTv)

        // Card 1: Your Focus Goal Card
        val goalCardDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 24f
            setColor(Color.parseColor("#161B22"))
            setStroke(2, Color.parseColor("#30363D"))
        }

        val goalCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = goalCardDrawable
            setPadding(28, 20, 28, 20)
            gravity = Gravity.CENTER
        }

        val goalHeaderTv = TextView(this).apply {
            text = "🎯 YOUR FOCUS GOAL"
            setTextColor(Color.parseColor("#5E6AD2"))
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
        }
        goalCard.addView(goalHeaderTv)

        val goalTitleTv = TextView(this).apply {
            text = sessionGoal
            setTextColor(Color.WHITE)
            textSize = 18f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 6, 0, 0)
        }
        goalCard.addView(goalTitleTv)

        val goalCardParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(0, 0, 0, 16)
        }
        rootLayout.addView(goalCard, goalCardParams)

        // Card 2: Motivation / Quest Card
        val motivationCardDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 24f
            setColor(Color.parseColor("#1C2128"))
            setStroke(2, Color.parseColor("#5E6AD2"))
        }

        val motivationCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = motivationCardDrawable
            setPadding(28, 20, 28, 20)
            gravity = Gravity.CENTER
        }

        val motivationHeaderTv = TextView(this).apply {
            text = "💡 WHY IT'S BLOCKED"
            setTextColor(Color.parseColor("#F59E0B"))
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
        }
        motivationCard.addView(motivationHeaderTv)

        val quoteTv = TextView(this).apply {
            text = "\"$randomQuote\""
            setTextColor(Color.parseColor("#D0D7DE"))
            textSize = 14f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
            gravity = Gravity.CENTER
            setPadding(0, 8, 0, 0)
        }
        motivationCard.addView(quoteTv)

        val motivationCardParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(0, 0, 0, 24)
        }
        rootLayout.addView(motivationCard, motivationCardParams)

        // Remaining Time Header
        val remHeaderTv = TextView(this).apply {
            text = "REMAINING SESSION TIME"
            setTextColor(Color.parseColor("#8B949E"))
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 4)
        }
        rootLayout.addView(remHeaderTv)

        // Remaining Time Counter
        remainingTimeTv = TextView(this).apply {
            text = FocusSessionManager.getRemainingTimeFormatted(this@BlockingActivity)
            setTextColor(Color.WHITE)
            textSize = 32f
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }
        rootLayout.addView(remainingTimeTv)

        // Dismiss Button [I'm Ready to Focus]
        val buttonDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 28f
            setColor(Color.parseColor("#5E6AD2"))
        }

        val button = Button(this).apply {
            text = "I'm Ready to Focus"
            setTextColor(Color.WHITE)
            textSize = 16f
            typeface = Typeface.DEFAULT_BOLD
            background = buttonDrawable
            setPadding(32, 16, 32, 16)
            setOnClickListener {
                goHomeAndFinish()
            }
        }
        val btnParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(16, 0, 16, 0)
        }
        rootLayout.addView(button, btnParams)

        setContentView(rootLayout)
    }

    override fun onResume() {
        super.onResume()
        handler.post(updateRunnable)
    }

    override fun onPause() {
        handler.removeCallbacks(updateRunnable)
        super.onPause()
    }

    private fun goHomeAndFinish() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Prevent back button bypass
        goHomeAndFinish()
    }
}

