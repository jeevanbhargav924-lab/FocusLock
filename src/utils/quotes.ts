export const MOTIVATIONAL_QUOTES = [
  'Focus is a muscle. The more you protect your attention, the stronger it becomes.',
  'Your future self will thank you for ignoring this distraction.',
  'Remember why you started this focus session! Deep work brings big results.',
  'Distractions promise quick fun, but focus delivers real success.',
  'You set a goal for a reason. Stay true to your commitment!',
  'Every time you resist a distraction, you train your brain for mastery.',
  'Small choices right now shape your biggest achievements tomorrow.',
  'Deep focus creates progress. Don’t trade your potential for a scroll.',
  'Protect your time—it is the most valuable resource you have.',
  'You are in control of your attention. Stay focused and finish strong!',
];

export function getRandomMotivationalQuote(): string {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}
