package com.focuslock

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.view.Gravity
import android.view.Window
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
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
                updateTimerText()
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

        val appName = intent.getStringExtra(EXTRA_BLOCKED_APP_NAME) ?: "Google"
        val activeSession = FocusSessionManager.getActiveSession(this)
        val sessionGoal = activeSession?.title.takeIf { !it.isNullOrBlank() } ?: "Study"
        val randomQuote = MotivationQuotes.getRandomQuote()

        // Root Container
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#070A10"))
            gravity = Gravity.CENTER
            setPadding(48, 64, 48, 64)
        }

        // Concentric Lock Graphic Circles
        val outerRing3Drawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setStroke(2, Color.parseColor("#1FFF5252"))
        }
        val outerRing3 = FrameLayout(this).apply {
            background = outerRing3Drawable
        }

        val outerRing2Drawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setStroke(2, Color.parseColor("#40FF5252"))
        }
        val outerRing2 = FrameLayout(this).apply {
            background = outerRing2Drawable
        }

        val redRingDrawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#0E1420"))
            setStroke(8, Color.parseColor("#FF5252"))
        }
        val redRing = FrameLayout(this).apply {
            background = redRingDrawable
        }

        val lockEmojiTv = TextView(this).apply {
            text = "🔒"
            textSize = 46f
            gravity = Gravity.CENTER
        }
        redRing.addView(lockEmojiTv, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER
        })

        val redRingParams = FrameLayout.LayoutParams(280, 280).apply {
            gravity = Gravity.CENTER
        }
        outerRing2.addView(redRing, redRingParams)

        val outerRing2Params = FrameLayout.LayoutParams(360, 360).apply {
            gravity = Gravity.CENTER
        }
        outerRing3.addView(outerRing2, outerRing2Params)

        val graphicParams = LinearLayout.LayoutParams(440, 440).apply {
            gravity = Gravity.CENTER
            setMargins(0, 0, 0, 32)
        }
        rootLayout.addView(outerRing3, graphicParams)

        // ACCESS RESTRICTED Label
        val accessRestrictedTv = TextView(this).apply {
            text = "ACCESS RESTRICTED"
            setTextColor(Color.parseColor("#FF5252"))
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            letterSpacing = 0.12f
            setPadding(0, 0, 0, 8)
        }
        rootLayout.addView(accessRestrictedTv)

        // App Blocked Subtitle
        val subTv = TextView(this).apply {
            text = "$appName is Locked"
            setTextColor(Color.WHITE)
            textSize = 26f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }
        rootLayout.addView(subTv)

        // Card 1: Your Focus Goal Card
        val goalCardDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 32f
            setColor(Color.parseColor("#0F172A"))
            setStroke(2, Color.parseColor("#15FFFFFF"))
        }

        val goalCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = goalCardDrawable
            setPadding(40, 28, 40, 28)
            gravity = Gravity.CENTER
        }

        val goalHeaderTv = TextView(this).apply {
            text = "🎯 YOUR FOCUS GOAL"
            setTextColor(Color.parseColor("#818CF8"))
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
        }
        goalCard.addView(goalHeaderTv)

        val goalTitleTv = TextView(this).apply {
            text = sessionGoal
            setTextColor(Color.WHITE)
            textSize = 20f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 8, 0, 0)
        }
        goalCard.addView(goalTitleTv)

        val goalCardParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(0, 0, 0, 20)
        }
        rootLayout.addView(goalCard, goalCardParams)

        // Card 2: Motivation / Why It's Blocked Card
        val motivationCardDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 32f
            setColor(Color.parseColor("#0F172A"))
            setStroke(2, Color.parseColor("#15FFFFFF"))
        }

        val motivationCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = motivationCardDrawable
            setPadding(40, 28, 40, 28)
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
            setTextColor(Color.parseColor("#CBD5E1"))
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
            setMargins(0, 0, 0, 28)
        }
        rootLayout.addView(motivationCard, motivationCardParams)

        // Remaining Time Header
        val remHeaderTv = TextView(this).apply {
            text = "REMAINING SESSION TIME"
            setTextColor(Color.parseColor("#64748B"))
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 6)
        }
        rootLayout.addView(remHeaderTv)

        // Remaining Time Counter with Red Colons
        remainingTimeTv = TextView(this).apply {
            textSize = 40f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }
        rootLayout.addView(remainingTimeTv)
        updateTimerText()

        // Stay Focused Pill Badge
        val pillDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 40f
            setColor(Color.parseColor("#1E293B"))
            setStroke(2, Color.parseColor("#15FFFFFF"))
        }
        val pillTv = TextView(this).apply {
            text = "⏱ Stay focused. You've got this!"
            setTextColor(Color.parseColor("#CBD5E1"))
            textSize = 13f
            typeface = Typeface.DEFAULT
            background = pillDrawable
            setPadding(32, 14, 32, 14)
            gravity = Gravity.CENTER
        }
        val pillParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER
            setMargins(0, 0, 0, 32)
        }
        rootLayout.addView(pillTv, pillParams)

        // Dismiss Button [🚀 I'M READY TO FOCUS]
        val buttonDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 32f
            setColor(Color.parseColor("#4F46E5"))
        }

        val button = Button(this).apply {
            text = "🚀 I'M READY TO FOCUS"
            setTextColor(Color.WHITE)
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            background = buttonDrawable
            setPadding(32, 24, 32, 24)
            setOnClickListener {
                goHomeAndFinish()
            }
        }
        val btnParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(0, 0, 0, 0)
        }
        rootLayout.addView(button, btnParams)

        setContentView(rootLayout)
    }

    private fun updateTimerText() {
        val raw = FocusSessionManager.getRemainingTimeFormatted(this)
        val spannable = SpannableString(raw)
        for (i in raw.indices) {
            if (raw[i] == ':') {
                spannable.setSpan(
                    ForegroundColorSpan(Color.parseColor("#FF5252")),
                    i,
                    i + 1,
                    Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
                )
            } else {
                spannable.setSpan(
                    ForegroundColorSpan(Color.WHITE),
                    i,
                    i + 1,
                    Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
                )
            }
        }
        remainingTimeTv.text = spannable
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
}
