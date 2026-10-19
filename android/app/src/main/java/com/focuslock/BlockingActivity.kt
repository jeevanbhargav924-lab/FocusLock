package com.focuslock

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

class BlockingActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_BLOCKED_APP_NAME = "EXTRA_BLOCKED_APP_NAME"
        const val EXTRA_BLOCKED_PKG = "EXTRA_BLOCKED_PKG"
    }

    private lateinit var remainingTimeTv: TextView
    private lateinit var subTv: TextView
    private lateinit var videoView: VideoView
    private lateinit var replayContainer: FrameLayout
    private lateinit var muteButtonTv: TextView
    private var mediaPlayer: MediaPlayer? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var isMuted = false
    private var currentVideo: MotivationalVideo? = null

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
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)

        // Capture system back button to safely return home instead of opening the blocked app
        onBackPressedDispatcher.addCallback(this, object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                goHomeAndFinish()
            }
        })

        // Fullscreen setup
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        @Suppress("DEPRECATION")
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )

        audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager

        val appName = intent.getStringExtra(EXTRA_BLOCKED_APP_NAME)?.takeIf { it.isNotBlank() } ?: "This App"
        val activeSession = FocusSessionManager.getActiveSession(this)
        val sessionGoal = activeSession?.title.takeIf { !it.isNullOrBlank() } ?: "Deep Focus Session"

        // Select a motivational video
        currentVideo = MotivationalVideoManager.getRandomVideo()
        val video = currentVideo!!

        // Scroll Container
        val scrollView = ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#070A10"))
            isFillViewport = true
            overScrollMode = View.OVER_SCROLL_NEVER
        }

        // Root vertical layout
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(20), dp(24), dp(20), dp(32))
        }
        scrollView.addView(rootLayout, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        // 1. ACCESS RESTRICTED Label
        val accessRestrictedTv = TextView(this).apply {
            text = "ACCESS RESTRICTED"
            setTextColor(Color.parseColor("#FF5252"))
            textSize = 11.5f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            letterSpacing = 0.12f
            setPadding(0, 0, 0, dp(4))
        }
        rootLayout.addView(accessRestrictedTv)

        // 2. App Locked Title
        subTv = TextView(this).apply {
            text = "$appName is Locked"
            setTextColor(Color.WHITE)
            textSize = 24f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(6))
        }
        rootLayout.addView(subTv)

        // 3. Goal Chip
        val goalChipDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(12).toFloat()
            setColor(Color.parseColor("#1F818CF8"))
            setStroke(dp(1), Color.parseColor("#40818CF8"))
        }
        val goalChipTv = TextView(this).apply {
            text = "🎯 $sessionGoal"
            setTextColor(Color.parseColor("#818CF8"))
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            background = goalChipDrawable
            setPadding(dp(12), dp(4), dp(12), dp(4))
            gravity = Gravity.CENTER
        }
        val goalParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(0, 0, 0, dp(14))
        }
        rootLayout.addView(goalChipTv, goalParams)

        // 4. Video Player Card
        val videoCardDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(16).toFloat()
            setColor(Color.parseColor("#0F172A"))
            setStroke(dp(1), Color.parseColor("#25FFFFFF"))
        }

        val videoCard = FrameLayout(this).apply {
            background = videoCardDrawable
            clipToOutline = true
        }

        val videoCardHeight = dp(190)
        val videoCardParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            videoCardHeight
        ).apply {
            setMargins(0, 0, 0, dp(8))
        }

        // Native VideoView
        videoView = VideoView(this).apply {
            val videoUri = Uri.parse("android.resource://" + packageName + "/" + video.rawResId)
            setVideoURI(videoUri)
        }
        videoCard.addView(videoView, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ).apply {
            gravity = Gravity.CENTER
        })

        // Replay Overlay Container (hidden while playing)
        replayContainer = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#99070A10"))
            visibility = View.GONE
        }

        val replayBtnDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(20).toFloat()
            setColor(Color.parseColor("#E64F46E5"))
            setStroke(dp(1), Color.parseColor("#818CF8"))
        }

        val replayBtn = TextView(this).apply {
            text = "🔄  Replay Motivation"
            setTextColor(Color.WHITE)
            textSize = 12.5f
            typeface = Typeface.DEFAULT_BOLD
            background = replayBtnDrawable
            setPadding(dp(16), dp(10), dp(16), dp(10))
            gravity = Gravity.CENTER
            setOnClickListener {
                replayContainer.visibility = View.GONE
                requestAudioFocus()
                videoView.seekTo(0)
                videoView.start()
            }
        }
        replayContainer.addView(replayBtn, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER
        })
        videoCard.addView(replayContainer, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))

        // Top Overlay Bar: Badge and Mute Button
        val topOverlayBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(12), dp(10), dp(12), 0)
        }

        val badgeDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(12).toFloat()
            setColor(Color.parseColor("#D0070A10"))
            setStroke(dp(1), Color.parseColor("#20FFFFFF"))
        }
        val badgeTv = TextView(this).apply {
            text = "🎯 FOCUS MOTIVATION"
            setTextColor(Color.parseColor("#818CF8"))
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            background = badgeDrawable
            setPadding(dp(10), dp(4), dp(10), dp(4))
        }
        topOverlayBar.addView(badgeTv, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        val spacer = View(this)
        topOverlayBar.addView(spacer, LinearLayout.LayoutParams(
            0,
            ViewGroup.LayoutParams.MATCH_PARENT,
            1f
        ))

        val muteBtnDrawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#D0070A10"))
            setStroke(dp(1), Color.parseColor("#20FFFFFF"))
        }
        muteButtonTv = TextView(this).apply {
            text = "🔊"
            textSize = 14f
            gravity = Gravity.CENTER
            background = muteBtnDrawable
            setOnClickListener {
                toggleMute()
            }
        }
        topOverlayBar.addView(muteButtonTv, LinearLayout.LayoutParams(dp(32), dp(32)))
        videoCard.addView(topOverlayBar, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        rootLayout.addView(videoCard, videoCardParams)

        // 5. Motivational Quote Card below Video
        val subCardDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(14).toFloat()
            setColor(Color.parseColor("#D90F172A"))
            setStroke(dp(1), Color.parseColor("#12FFFFFF"))
        }
        val subCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = subCardDrawable
            setPadding(dp(16), dp(10), dp(16), dp(10))
            gravity = Gravity.CENTER
        }

        val quoteTv = TextView(this).apply {
            text = "\"${video.englishText}\""
            setTextColor(Color.WHITE)
            textSize = 14f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC)
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.25f)
        }
        subCard.addView(quoteTv)

        val subCardParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(0, 0, 0, dp(12))
        }
        rootLayout.addView(subCard, subCardParams)

        // 6. Remaining Time Header
        val remHeaderTv = TextView(this).apply {
            text = "REMAINING SESSION TIME"
            setTextColor(Color.parseColor("#64748B"))
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(4))
        }
        rootLayout.addView(remHeaderTv)

        // 7. Remaining Time Counter with Red Colons
        remainingTimeTv = TextView(this).apply {
            textSize = 38f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(8))
        }
        rootLayout.addView(remainingTimeTv)
        updateTimerText()

        // 8. Stay Focused Pill Badge
        val pillDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(20).toFloat()
            setColor(Color.parseColor("#1E293B"))
            setStroke(dp(1), Color.parseColor("#15FFFFFF"))
        }
        val pillTv = TextView(this).apply {
            text = "⏱ Stay focused. You've got this!"
            setTextColor(Color.parseColor("#CBD5E1"))
            textSize = 12.5f
            typeface = Typeface.DEFAULT
            background = pillDrawable
            setPadding(dp(16), dp(7), dp(16), dp(7))
            gravity = Gravity.CENTER
        }
        val pillParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            setMargins(0, 0, 0, dp(14))
        }
        rootLayout.addView(pillTv, pillParams)

        // 9. Back to Focus Button [🚀 BACK TO FOCUS]
        val buttonDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(16).toFloat()
            setColor(Color.parseColor("#4F46E5"))
        }
        val button = Button(this).apply {
            text = "🚀 BACK TO FOCUS"
            setTextColor(Color.WHITE)
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            background = buttonDrawable
            setPadding(dp(20), dp(16), dp(20), dp(16))
            setOnClickListener {
                goHomeAndFinish()
            }
        }
        val btnParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            dp(54)
        ).apply {
            setMargins(0, 0, 0, 0)
        }
        rootLayout.addView(button, btnParams)

        setContentView(scrollView)

        // VideoView Listeners
        videoView.setOnPreparedListener { mp ->
            mediaPlayer = mp
            mp.isLooping = false
            if (isMuted) {
                mp.setVolume(0f, 0f)
            } else {
                mp.setVolume(1.0f, 1.0f)
            }
            requestAudioFocus()
            videoView.start()
        }

        videoView.setOnCompletionListener {
            abandonAudioFocus()
            replayContainer.visibility = View.VISIBLE
        }

        videoView.setOnErrorListener { _, _, _ ->
            // In case of any video hardware decoding error, keep UI functional and do not crash
            abandonAudioFocus()
            true
        }
    }

    private fun dp(dpVal: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dpVal.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    private fun toggleMute() {
        isMuted = !isMuted
        muteButtonTv.text = if (isMuted) "🔇" else "🔊"
        mediaPlayer?.let { mp ->
            try {
                if (isMuted) {
                    mp.setVolume(0f, 0f)
                } else {
                    mp.setVolume(1.0f, 1.0f)
                }
            } catch (_: Exception) {}
        }
    }

    private fun requestAudioFocus() {
        if (isMuted) return
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val playbackAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
            val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(playbackAttributes)
                .setAcceptsDelayedFocusGain(false)
                .build()
            audioFocusRequest = request
            am.requestAudioFocus(request)
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
        }
    }

    private fun abandonAudioFocus() {
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { am.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            am.abandonAudioFocus(null)
        }
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
        if (::videoView.isInitialized && !videoView.isPlaying && replayContainer.visibility != View.VISIBLE) {
            requestAudioFocus()
            videoView.start()
        }
    }

    override fun onPause() {
        handler.removeCallbacks(updateRunnable)
        if (::videoView.isInitialized && videoView.isPlaying) {
            videoView.pause()
        }
        abandonAudioFocus()
        super.onPause()
    }

    override fun onDestroy() {
        if (::videoView.isInitialized) {
            videoView.stopPlayback()
        }
        abandonAudioFocus()
        super.onDestroy()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)
        val appName = intent.getStringExtra(EXTRA_BLOCKED_APP_NAME)?.takeIf { it.isNotBlank() } ?: "This App"
        if (::subTv.isInitialized) {
            subTv.text = "$appName is Locked"
        }
        updateTimerText()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        goHomeAndFinish()
    }

    private fun goHomeAndFinish() {
        if (::videoView.isInitialized) {
            videoView.stopPlayback()
        }
        abandonAudioFocus()
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)
    }
}
