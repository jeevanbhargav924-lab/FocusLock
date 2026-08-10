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

        // Root Container
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0D1117"))
            gravity = Gravity.CENTER
            setPadding(48, 64, 48, 64)
        }

        // Header Icon 🚫
        val iconTv = TextView(this).apply {
            text = "🚫"
            textSize = 48f
            gravity = Gravity.CENTER
        }
        rootLayout.addView(iconTv)

        // Focus Mode Active Title
        val titleTv = TextView(this).apply {
            text = "Focus Mode Active"
            setTextColor(Color.WHITE)
            textSize = 26f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 12)
        }
        rootLayout.addView(titleTv)

        // App Blocked Subtitle
        val subTv = TextView(this).apply {
            text = "$appName is blocked."
            setTextColor(Color.parseColor("#F59E0B"))
            textSize = 18f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 36)
        }
        rootLayout.addView(subTv)

        // Remaining Time Header
        val remHeaderTv = TextView(this).apply {
            text = "Remaining Time:"
            setTextColor(Color.parseColor("#8B949E"))
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, 12, 0, 4)
        }
        rootLayout.addView(remHeaderTv)

        // Remaining Time Counter
        remainingTimeTv = TextView(this).apply {
            text = FocusSessionManager.getRemainingTimeFormatted(this@BlockingActivity)
            setTextColor(Color.WHITE)
            textSize = 36f
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 36)
        }
        rootLayout.addView(remainingTimeTv)

        // Stay Focused Message
        val messageTv = TextView(this).apply {
            text = "Stay focused."
            setTextColor(Color.parseColor("#8B949E"))
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 48)
        }
        rootLayout.addView(messageTv)

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
            setMargins(32, 0, 32, 0)
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
