import {
  MOTIVATIONAL_VIDEOS,
  getRandomMotivationalVideo,
} from '../src/utils/motivationalVideos';

describe('Motivational Videos Feature', () => {
  it('should have 5 curated motivational video configurations', () => {
    expect(MOTIVATIONAL_VIDEOS).toBeDefined();
    expect(MOTIVATIONAL_VIDEOS.length).toBe(5);
  });

  it('each video item should have required metadata, Hindi script, and raw resource', () => {
    MOTIVATIONAL_VIDEOS.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.hindiText).toBeTruthy();
      expect(item.englishText).toBeTruthy();
      expect(item.durationSeconds).toBeGreaterThan(4);
      expect(item.durationSeconds).toBeLessThan(15);
      expect(item.rawResourceName).toMatch(/^[a-z0-9_]+$/);
    });
  });

  it('contains the specified Hindi motivational scripts', () => {
    const hindiScripts = MOTIVATIONAL_VIDEOS.map(v => v.hindiText);
    expect(hindiScripts).toContain(
      'बस पाँच मिनट का distraction, तुम्हारे एक घंटे के focus को खराब कर सकता है। वापस पढ़ाई पर लौटो।'
    );
    expect(hindiScripts).toContain(
      'आज की मेहनत ही कल तुम्हारा confidence बनेगी। हार मत मानो।'
    );
    expect(hindiScripts).toContain(
      'तुमने अपना लक्ष्य चुना है। अब उसे पूरा करने का समय है।'
    );
    expect(hindiScripts).toContain(
      'हर focused minute तुम्हें तुम्हारे सपने के करीब ले जाता है।'
    );
    expect(hindiScripts).toContain(
      'फोन बाद में भी देख सकते हो। तुम्हारा लक्ष्य अभी तुम्हारा इंतज़ार कर रहा है।'
    );
  });

  it('getRandomMotivationalVideo returns valid item and rotates', () => {
    const first = getRandomMotivationalVideo();
    expect(first).toBeDefined();
    expect(MOTIVATIONAL_VIDEOS).toContain(first);

    const second = getRandomMotivationalVideo();
    expect(second).toBeDefined();
    // Subsequent selection avoids immediate duplicate
    expect(second.id).not.toBe(first.id);
  });
});
