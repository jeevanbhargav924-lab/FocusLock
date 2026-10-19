// Auto-generated motivational videos configuration with Hindi quotes and subtitles
export interface MotivationalVideoItem {
  id: string;
  title: string;
  hindiText: string;
  englishText: string;
  durationSeconds: number;
  // Local require for React Native bundle
  source: any;
  rawResourceName: string;
}

export const MOTIVATIONAL_VIDEOS: MotivationalVideoItem[] = [
  {
    id: 'study_motivation_01',
    title: 'Beat Distraction',
    hindiText: 'बस पाँच मिनट का distraction, तुम्हारे एक घंटे के focus को खराब कर सकता है। वापस पढ़ाई पर लौटो।',
    englishText: 'Just 5 minutes of distraction can ruin an hour of focus. Return to study.',
    durationSeconds: 9.0,
    source: require('../../assets/videos/study_motivation_01.mp4'),
    rawResourceName: 'study_motivation_01',
  },
  {
    id: 'study_motivation_02',
    title: 'Build Confidence',
    hindiText: 'आज की मेहनत ही कल तुम्हारा confidence बनेगी। हार मत मानो।',
    englishText: "Today's hard work will become your confidence tomorrow. Don't give up.",
    durationSeconds: 5.6,
    source: require('../../assets/videos/study_motivation_02.mp4'),
    rawResourceName: 'study_motivation_02',
  },
  {
    id: 'study_motivation_03',
    title: 'Fulfill Your Goal',
    hindiText: 'तुमने अपना लक्ष्य चुना है। अब उसे पूरा करने का समय है।',
    englishText: 'You chose your goal. Now is the time to fulfill it.',
    durationSeconds: 5.8,
    source: require('../../assets/videos/study_motivation_03.mp4'),
    rawResourceName: 'study_motivation_03',
  },
  {
    id: 'study_motivation_04',
    title: 'Closer to Dreams',
    hindiText: 'हर focused minute तुम्हें तुम्हारे सपने के करीब ले जाता है।',
    englishText: 'Every focused minute takes you closer to your dream.',
    durationSeconds: 5.2,
    source: require('../../assets/videos/study_motivation_04.mp4'),
    rawResourceName: 'study_motivation_04',
  },
  {
    id: 'discipline_01',
    title: 'Stay Disciplined',
    hindiText: 'फोन बाद में भी देख सकते हो। तुम्हारा लक्ष्य अभी तुम्हारा इंतज़ार कर रहा है।',
    englishText: 'You can check your phone later. Your goal is waiting for you right now.',
    durationSeconds: 7.0,
    source: require('../../assets/videos/discipline_01.mp4'),
    rawResourceName: 'discipline_01',
  },
];

let lastVideoIndex = -1;

export function getRandomMotivationalVideo(): MotivationalVideoItem {
  if (MOTIVATIONAL_VIDEOS.length === 1) return MOTIVATIONAL_VIDEOS[0];
  let nextIndex: number;
  do {
    nextIndex = Math.floor(Math.random() * MOTIVATIONAL_VIDEOS.length);
  } while (nextIndex === lastVideoIndex);
  lastVideoIndex = nextIndex;
  return MOTIVATIONAL_VIDEOS[nextIndex];
}
