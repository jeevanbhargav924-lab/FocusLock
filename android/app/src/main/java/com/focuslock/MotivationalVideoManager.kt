package com.focuslock

import java.util.Random

data class MotivationalVideo(
    val id: String,
    val title: String,
    val rawResId: Int,
    val hindiText: String,
    val englishText: String
)

object MotivationalVideoManager {
    private var lastIndex = -1

    val videos = listOf(
        MotivationalVideo(
            id = "study_motivation_01",
            title = "Beat Distraction",
            rawResId = R.raw.study_motivation_01,
            hindiText = "बस पाँच मिनट का distraction, तुम्हारे एक घंटे के focus को खराब कर सकता है। वापस पढ़ाई पर लौटो।",
            englishText = "Just 5 minutes of distraction can ruin an hour of focus. Return to study."
        ),
        MotivationalVideo(
            id = "study_motivation_02",
            title = "Build Confidence",
            rawResId = R.raw.study_motivation_02,
            hindiText = "आज की मेहनत ही कल तुम्हारा confidence बनेगी। हार मत मानो।",
            englishText = "Today's hard work will become your confidence tomorrow. Don't give up."
        ),
        MotivationalVideo(
            id = "study_motivation_03",
            title = "Fulfill Your Goal",
            rawResId = R.raw.study_motivation_03,
            hindiText = "तुमने अपना लक्ष्य चुना है। अब उसे पूरा करने का समय है।",
            englishText = "You chose your goal. Now is the time to fulfill it."
        ),
        MotivationalVideo(
            id = "study_motivation_04",
            title = "Closer to Dreams",
            rawResId = R.raw.study_motivation_04,
            hindiText = "हर focused minute तुम्हें तुम्हारे सपने के करीब ले जाता है।",
            englishText = "Every focused minute takes you closer to your dream."
        ),
        MotivationalVideo(
            id = "discipline_01",
            title = "Stay Disciplined",
            rawResId = R.raw.discipline_01,
            hindiText = "फोन बाद में भी देख सकते हो। तुम्हारा लक्ष्य अभी तुम्हारा इंतज़ार कर रहा है।",
            englishText = "You can check your phone later. Your goal is waiting for you right now."
        )
    )

    fun getRandomVideo(): MotivationalVideo {
        if (videos.size <= 1) return videos[0]
        var nextIndex: Int
        val random = Random()
        do {
            nextIndex = random.nextInt(videos.size)
        } while (nextIndex == lastIndex)
        lastIndex = nextIndex
        return videos[nextIndex]
    }
}
