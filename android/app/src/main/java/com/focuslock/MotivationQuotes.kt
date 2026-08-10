package com.focuslock

import java.util.Random

object MotivationQuotes {
    private val quotes = listOf(
        "Focus is a muscle. The more you protect your attention, the stronger it becomes.",
        "Your future self will thank you for ignoring this distraction.",
        "Remember why you started this focus session! Deep work brings big results.",
        "Distractions promise quick fun, but focus delivers real success.",
        "You set a goal for a reason. Stay true to your commitment!",
        "Every time you resist a distraction, you train your brain for mastery.",
        "Small choices right now shape your biggest achievements tomorrow.",
        "Deep focus creates progress. Don't trade your potential for a scroll.",
        "Protect your time—it's the most valuable resource you have.",
        "You are in control of your attention. Stay focused and finish strong!"
    )

    fun getRandomQuote(): String {
        val randomIndex = Random().nextInt(quotes.size)
        return quotes[randomIndex]
    }
}
