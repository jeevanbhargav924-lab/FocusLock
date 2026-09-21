import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScoreBreakdown {
  totalScore: number;
  completionScore: number; // 0 - 50
  distractionScore: number; // 0 - 25
  durationScore: number; // 0 - 15
  disciplineScore: number; // 0 - 10
}

/**
 * Deterministic, explainable Focus Score algorithm.
 * Factors:
 * - Session completion percentage & natural completion bonus (0-50 pts)
 * - Distraction resistance (0-25 pts)
 * - Focus stamina / duration (0-15 pts)
 * - Emergency discipline (0-10 pts)
 */
export function calculateFocusScore(params: {
  plannedMinutes: number;
  actualMinutes: number;
  status: 'completed' | 'ended' | 'interrupted';
  distractionAttempts: number;
  emergencyUnlocks?: number;
  strictMode?: boolean;
}): ScoreBreakdown {
  const { plannedMinutes, actualMinutes, status, distractionAttempts, emergencyUnlocks = 0 } = params;

  // 1. Completion Score (0 - 50 pts)
  const planned = Math.max(1, plannedMinutes);
  const ratio = Math.min(1.0, actualMinutes / planned);
  let completionScore = Math.round(ratio * 40);
  if (status === 'completed') {
    completionScore = 50; // Natural completion gets full 50 pts
  } else {
    completionScore = Math.min(45, completionScore);
  }

  // 2. Distraction Resistance (0 - 25 pts)
  let distractionScore = 25;
  if (distractionAttempts <= 0) {
    distractionScore = 25;
  } else if (distractionAttempts === 1) {
    distractionScore = 20;
  } else if (distractionAttempts === 2) {
    distractionScore = 15;
  } else if (distractionAttempts === 3) {
    distractionScore = 10;
  } else if (distractionAttempts === 4) {
    distractionScore = 5;
  } else {
    distractionScore = Math.max(0, 25 - distractionAttempts * 5);
  }

  // 3. Focus Duration Stamina (0 - 15 pts)
  let durationScore = 5;
  if (actualMinutes >= 60) {
    durationScore = 15;
  } else if (actualMinutes >= 45) {
    durationScore = 13;
  } else if (actualMinutes >= 25) {
    durationScore = 10;
  } else if (actualMinutes >= 15) {
    durationScore = 7;
  } else if (actualMinutes >= 5) {
    durationScore = 5;
  } else {
    durationScore = 2;
  }

  // 4. Emergency Discipline (0 - 10 pts)
  let disciplineScore = 10;
  if (emergencyUnlocks === 0) {
    disciplineScore = 10;
  } else if (emergencyUnlocks === 1) {
    disciplineScore = 4;
  } else {
    disciplineScore = 0;
  }

  const total = Math.min(
    100,
    Math.max(0, completionScore + distractionScore + durationScore + disciplineScore)
  );

  return {
    totalScore: total,
    completionScore,
    distractionScore,
    durationScore,
    disciplineScore,
  };
}

// Daily Focus Goal Storage Keys & Management
const KEY_DAILY_FOCUS_GOAL = '@focuslock_daily_goal_minutes';
export const DEFAULT_DAILY_GOAL_MINS = 60;

export const getDailyFocusGoal = async (): Promise<number> => {
  try {
    const val = await AsyncStorage.getItem(KEY_DAILY_FOCUS_GOAL);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading daily focus goal:', e);
  }
  return DEFAULT_DAILY_GOAL_MINS;
};

export const setDailyFocusGoal = async (minutes: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY_DAILY_FOCUS_GOAL, minutes.toString());
  } catch (e) {
    console.warn('Error saving daily focus goal:', e);
  }
};

export interface TodayGoalProgress {
  goalMinutes: number;
  focusedMinutes: number;
  remainingMinutes: number;
  percent: number; // 0 - 100
  isCompleted: boolean;
  distractionsBlocked: number;
  completedSessionsCount: number;
}

export const getTodayGoalProgress = async (
  userId: string = 'default_user'
): Promise<TodayGoalProgress> => {
  const goalMinutes = await getDailyFocusGoal();
  const sessions = await getHistorySessions(userId, 'all');

  const todayDate = new Date();
  const todayYear = todayDate.getFullYear();
  const todayMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
  const todayDay = String(todayDate.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  let focusedMinutes = 0;
  let distractionsBlocked = 0;
  let completedCount = 0;

  sessions.forEach(s => {
    const dateObj = new Date(s.created_at || Date.now());
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    if (`${y}-${m}-${d}` === todayStr) {
      const mins = s.actual_minutes || (s.status === 'completed' ? s.planned_minutes : 0) || 0;
      focusedMinutes += mins;
      distractionsBlocked += s.blocked_attempts || 0;
      if (s.status === 'completed') {
        completedCount++;
      }
    }
  });

  // Query native today distractions count if higher (ensures accurate count even between sessions)
  if (Platform.OS === 'android' && NativeModules.PermissionModule?.getTodayDistractionsCount) {
    try {
      const nativeDistractions = await NativeModules.PermissionModule.getTodayDistractionsCount();
      if (typeof nativeDistractions === 'number' && nativeDistractions > distractionsBlocked) {
        distractionsBlocked = nativeDistractions;
      }
    } catch {}
  }

  const remainingMinutes = Math.max(0, goalMinutes - focusedMinutes);
  const percent = Math.min(100, Math.round((focusedMinutes / Math.max(1, goalMinutes)) * 100));
  const isCompleted = focusedMinutes >= goalMinutes && goalMinutes > 0;

  return {
    goalMinutes,
    focusedMinutes,
    remainingMinutes,
    percent,
    isCompleted,
    distractionsBlocked,
    completedSessionsCount: completedCount,
  };
};

export const getActiveDistractions = async (): Promise<{
  totalCount: number;
  topApp: string;
  topAppCount: number;
}> => {
  if (Platform.OS === 'android' && NativeModules.PermissionModule?.getActiveSessionDistractions) {
    try {
      const data = await NativeModules.PermissionModule.getActiveSessionDistractions();
      return {
        totalCount: data?.totalCount ?? 0,
        topApp: data?.topApp ?? '',
        topAppCount: data?.topAppCount ?? 0,
      };
    } catch {}
  }
  return { totalCount: 0, topApp: '', topAppCount: 0 };
};

export const getHistorySessions = async (
  userId: string = 'default_user',
  filter: 'all' | 'completed' | 'interrupted' = 'all'
): Promise<SessionRecord[]> => {
  // 1. Try Native Android SQLite DB first
  if (Platform.OS === 'android' && NativeModules.PermissionModule?.getNativeHistorySessions) {
    try {
      const nativeList = await NativeModules.PermissionModule.getNativeHistorySessions();
      if (Array.isArray(nativeList) && nativeList.length > 0) {
        const formattedList: SessionRecord[] = nativeList.map((item: any) => {
          const startDate = new Date(item.start_time || Date.now());
          const endDate = new Date(item.end_time || Date.now());
          const plannedDuration = item.duration_minutes || 25;
          const actualMins =
            item.actual_minutes && item.actual_minutes > 0
              ? item.actual_minutes
              : plannedDuration;
          const status =
            item.status === 'ended' || item.status === 'interrupted'
              ? item.status
              : item.status === 'active'
              ? 'completed'
              : item.status || 'completed';
          const blocked = item.blocked_attempts ?? 0;

          // Compute deterministic score if missing or if default 100 was set for early ended session
          let score = item.score ?? 100;
          if (status !== 'completed' && score === 100) {
            score = calculateFocusScore({
              plannedMinutes: plannedDuration,
              actualMinutes: actualMins,
              status: status,
              distractionAttempts: blocked,
            }).totalScore;
          }

          return {
            id: item.id || `s-${Date.now()}`,
            user_id: userId,
            title: item.title || 'Focus Session',
            category: 'coding',
            start_time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            end_time: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            planned_minutes: plannedDuration,
            actual_minutes: actualMins,
            status,
            score,
            blocked_attempts: blocked,
            created_at: item.start_time || Date.now(),
          };
        });

        if (filter !== 'all') {
          return formattedList.filter(s => s.status === filter);
        }
        return formattedList;
      }
    } catch (e) {
      console.warn('Error fetching native history sessions:', e);
    }
  }
  if (sqliteDbInstance) {
    try {
      let query = 'SELECT * FROM sessions';
      const params: any[] = [];

      if (userId && userId !== 'all') {
        query += ' WHERE (user_id = ? OR user_id = "default_user" OR user_id = "guest_user")';
        params.push(userId);
      } else {
        query += ' WHERE 1=1';
      }

      if (filter !== 'all') {
        query += ' AND status = ?';
        params.push(filter);
      }

      query += ' ORDER BY created_at DESC;';

      const [results] = await sqliteDbInstance.executeSql(query, params);
      const list: SessionRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        list.push(results.rows.item(i));
      }
      if (list.length > 0) {
        return list;
      }
    } catch (e) {
      console.warn('Error querying SQLite history:', e);
    }
  }

  // Fallback in-memory query
  return inMemorySessions.filter(s => {
    if (filter === 'completed') return s.status === 'completed';
    if (filter === 'interrupted') return s.status === 'interrupted';
    return true;
  });
};

export interface SessionRecord {
  id: string;
  user_id: string;
  title: string;
  category: string; // 'reading' | 'coding' | 'journaling' | 'general'
  start_time: string; // ISO or formatted
  end_time: string;
  planned_minutes: number;
  actual_minutes: number;
  status: 'completed' | 'interrupted' | 'ended';
  score: number; // 0 - 100
  blocked_attempts: number;
  created_at: number; // timestamp
}

export interface UserStatsRecord {
  user_id: string;
  current_streak: number;
  longest_session_mins: number;
  most_hours_in_day: number;
  total_focus_hours: number;
  unlocked_badges_count: number;
  total_badges_count: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number; // minutes or sessions count
  level: 0 | 1 | 2 | 3 | 4;
}

export interface UserProfileRecord {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string;
  created_at: number;
}

// In-Memory fallback store for environments before SQLite native module is linked
let inMemoryUsers: UserProfileRecord[] = [];

let inMemorySessions: SessionRecord[] = [];

let sqliteDbInstance: any = null;

// Dynamically attempt sqlite import
const getSQLite = () => {
  try {
    const SQLite = require('react-native-sqlite-storage');
    SQLite.enablePromise(true);
    return SQLite;
  } catch {
    return null;
  }
};

export const initDatabase = async (): Promise<void> => {
  const SQLite = getSQLite();
  if (!SQLite) {
    console.log('SQLite native module not yet linked; using memory store.');
    return;
  }

  try {
    sqliteDbInstance = await SQLite.openDatabase({
      name: 'focuslock.db',
      location: 'default',
    });

    await sqliteDbInstance.executeSql(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        planned_minutes INTEGER,
        actual_minutes INTEGER,
        status TEXT,
        score INTEGER,
        blocked_attempts INTEGER,
        created_at INTEGER
      );
    `);

    await sqliteDbInstance.executeSql(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id TEXT PRIMARY KEY,
        current_streak INTEGER,
        longest_session_mins INTEGER,
        most_hours_in_day REAL,
        total_focus_hours REAL
      );
    `);

    await sqliteDbInstance.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        photo_url TEXT,
        created_at INTEGER
      );
    `);
  } catch (e) {
    console.warn('Error initializing SQLite database:', e);
  }
};

export const saveSessionRecord = async (
  session: Omit<SessionRecord, 'id' | 'created_at' | 'user_id'>,
  userId: string = 'default_user'
): Promise<SessionRecord> => {
  const newRecord: SessionRecord = {
    ...session,
    id: `s-${Date.now()}`,
    user_id: userId,
    created_at: Date.now(),
  };

  inMemorySessions.unshift(newRecord);

  if (sqliteDbInstance) {
    try {
      await sqliteDbInstance.executeSql(
        `INSERT INTO sessions (id, user_id, title, category, start_time, end_time, planned_minutes, actual_minutes, status, score, blocked_attempts, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newRecord.id,
          newRecord.user_id,
          newRecord.title,
          newRecord.category,
          newRecord.start_time,
          newRecord.end_time,
          newRecord.planned_minutes,
          newRecord.actual_minutes,
          newRecord.status,
          newRecord.score,
          newRecord.blocked_attempts,
          newRecord.created_at,
        ]
      );
    } catch (e) {
      console.warn('Error saving session to SQLite:', e);
    }
  }

  return newRecord;
};


export const getUserStats = async (userId: string = 'default_user'): Promise<UserStatsRecord> => {
  const sessions = await getHistorySessions(userId, 'all');
  const completed = sessions.filter(s => s.status === 'completed');

  if (completed.length === 0) {
    return {
      user_id: userId,
      current_streak: 0,
      longest_session_mins: 0,
      most_hours_in_day: 0,
      total_focus_hours: 0,
      unlocked_badges_count: 0,
      total_badges_count: 0,
    };
  }

  // 1. Longest Session & Total Focus Hours
  let longestSession = 0;
  let totalMins = 0;
  const dailyMinsMap: Record<string, number> = {};
  const completedDatesSet = new Set<string>();

  completed.forEach(s => {
    const mins = s.actual_minutes || s.planned_minutes || 0;
    totalMins += mins;
    if (mins > longestSession) {
      longestSession = mins;
    }

    const dateObj = new Date(s.created_at || Date.now());
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    completedDatesSet.add(dateStr);
    dailyMinsMap[dateStr] = (dailyMinsMap[dateStr] || 0) + mins;
  });

  // 2. Most Hours in a Day
  let maxDailyMins = 0;
  Object.values(dailyMinsMap).forEach(mins => {
    if (mins > maxDailyMins) {
      maxDailyMins = mins;
    }
  });

  // 3. Real Consecutive Day Streak
  const todayObj = new Date();
  let streak = 0;
  let checkDateObj = new Date(todayObj);

  const getFormattedDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  let checkStr = getFormattedDate(checkDateObj);

  // If completed today, count today and go backwards
  if (completedDatesSet.has(checkStr)) {
    while (completedDatesSet.has(checkStr)) {
      streak += 1;
      checkDateObj.setDate(checkDateObj.getDate() - 1);
      checkStr = getFormattedDate(checkDateObj);
    }
  } else {
    // Check if completed yesterday
    checkDateObj.setDate(checkDateObj.getDate() - 1);
    checkStr = getFormattedDate(checkDateObj);
    while (completedDatesSet.has(checkStr)) {
      streak += 1;
      checkDateObj.setDate(checkDateObj.getDate() - 1);
      checkStr = getFormattedDate(checkDateObj);
    }
  }

  // 4. Compute Badges & Achievements
  const totalBlocked = sessions.reduce((acc, s) => acc + (s.blocked_attempts || 0), 0);
  const strictCount = sessions.filter(s => s.status === 'completed' && s.score > 0).length; // sessions completed with discipline
  const pomodoroCount = completed.filter(s => (s.planned_minutes === 25 || s.actual_minutes >= 25)).length;
  const perfectScoreCount = completed.filter(s => s.score === 100).length;

  let unlockedBadges = 0;
  if (streak >= 7) unlockedBadges++;
  if (totalBlocked >= 50) unlockedBadges++;
  if (totalMins >= 6000) unlockedBadges++; // 100 hrs
  if (completed.length >= 1) unlockedBadges++;
  if (strictCount >= 3) unlockedBadges++;
  if (perfectScoreCount >= 1) unlockedBadges++;
  if (pomodoroCount >= 5) unlockedBadges++;

  return {
    user_id: userId,
    current_streak: streak,
    longest_session_mins: longestSession,
    most_hours_in_day: parseFloat((maxDailyMins / 60).toFixed(1)),
    total_focus_hours: parseFloat((totalMins / 60).toFixed(1)),
    unlocked_badges_count: unlockedBadges,
    total_badges_count: 9,
  };
};

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0 to 1
  currentValue: number;
  targetValue: number;
  unit: string;
  color: string;
  category: 'streak' | 'hours' | 'shield' | 'discipline' | 'focus' | 'special';
}

export interface FocusLevelInfo {
  level: number;
  rankTitle: string;
  totalXp: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progress: number; // 0 to 1
}

export interface UserAchievementsData {
  badges: BadgeItem[];
  levelInfo: FocusLevelInfo;
  stats: UserStatsRecord;
  unlockedCount: number;
  totalCount: number;
}

export const getUserAchievements = async (
  userId: string = 'default_user'
): Promise<UserAchievementsData> => {
  const sessions = await getHistorySessions(userId, 'all');
  const stats = await getUserStats(userId);
  const completed = sessions.filter(s => s.status === 'completed');

  // Compute metrics across sessions
  const totalBlocked = sessions.reduce((acc, s) => acc + (s.blocked_attempts || 0), 0);
  const totalFocusMins = completed.reduce(
    (acc, s) => acc + (s.actual_minutes || s.planned_minutes || 0),
    0
  );
  const totalHours = parseFloat((totalFocusMins / 60).toFixed(1));
  const pomodoroCount = completed.filter(
    s => s.planned_minutes === 25 || s.actual_minutes >= 25
  ).length;
  const perfectScoreCount = completed.filter(s => s.score === 100).length;
  const zeroDistractionSessions = completed.filter(
    s => !s.blocked_attempts || s.blocked_attempts === 0
  ).length;
  const streak = stats.current_streak;

  // Check night owl (session between 9 PM and 4 AM)
  const hasNightOwl = sessions.some(s => {
    const d = new Date(s.created_at || Date.now());
    const h = d.getHours();
    return h >= 21 || h < 4;
  });

  // Check early bird (session between 5 AM and 8 AM)
  const hasEarlyBird = sessions.some(s => {
    const d = new Date(s.created_at || Date.now());
    const h = d.getHours();
    return h >= 5 && h < 8;
  });

  // 9 Concrete Badges
  const badges: BadgeItem[] = [
    {
      id: '7_day_titan',
      title: '7-Day Titan',
      description: 'Maintain a 7-day continuous focus streak',
      icon: '🔥',
      unlocked: streak >= 7,
      progress: Math.min(1, streak / 7),
      currentValue: streak,
      targetValue: 7,
      unit: 'days',
      color: '#FF9500',
      category: 'streak',
    },
    {
      id: 'distraction_shield',
      title: 'Distraction Shield',
      description: 'Block 50+ app distraction attempts',
      icon: '🛡️',
      unlocked: totalBlocked >= 50,
      progress: Math.min(1, totalBlocked / 50),
      currentValue: totalBlocked,
      targetValue: 50,
      unit: 'blocked',
      color: '#00E676',
      category: 'shield',
    },
    {
      id: 'century_master',
      title: 'Century Master',
      description: 'Accumulate 100+ deep focus hours',
      icon: '💎',
      unlocked: totalHours >= 100,
      progress: Math.min(1, totalHours / 100),
      currentValue: totalHours,
      targetValue: 100,
      unit: 'hours',
      color: '#38BDF8',
      category: 'hours',
    },
    {
      id: 'first_step',
      title: 'First Step',
      description: 'Complete your first focus session',
      icon: '🚀',
      unlocked: completed.length >= 1,
      progress: completed.length >= 1 ? 1 : 0,
      currentValue: Math.min(1, completed.length),
      targetValue: 1,
      unit: 'session',
      color: '#A855F7',
      category: 'special',
    },
    {
      id: 'iron_will',
      title: 'Iron Will',
      description: 'Complete 3+ sessions with strict discipline',
      icon: '⚡',
      unlocked: completed.length >= 3,
      progress: Math.min(1, completed.length / 3),
      currentValue: Math.min(3, completed.length),
      targetValue: 3,
      unit: 'sessions',
      color: '#EAB308',
      category: 'discipline',
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Achieve a flawless 100/100 Focus Score',
      icon: '🎯',
      unlocked: perfectScoreCount >= 1,
      progress: perfectScoreCount >= 1 ? 1 : 0,
      currentValue: Math.min(1, perfectScoreCount),
      targetValue: 1,
      unit: 'score',
      color: '#EC4899',
      category: 'discipline',
    },
    {
      id: 'pomodoro_master',
      title: 'Pomodoro Master',
      description: 'Complete 5 Pomodoro (25m) sprints',
      icon: '🍅',
      unlocked: pomodoroCount >= 5,
      progress: Math.min(1, pomodoroCount / 5),
      currentValue: pomodoroCount,
      targetValue: 5,
      unit: 'sprints',
      color: '#EF4444',
      category: 'focus',
    },
    {
      id: 'night_owl',
      title: 'Night Owl',
      description: 'Complete a late-night focus session (9 PM – 4 AM)',
      icon: '🦉',
      unlocked: hasNightOwl,
      progress: hasNightOwl ? 1 : 0,
      currentValue: hasNightOwl ? 1 : 0,
      targetValue: 1,
      unit: 'session',
      color: '#6366F1',
      category: 'special',
    },
    {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Complete an early morning session (5 AM – 8 AM)',
      icon: '🌅',
      unlocked: hasEarlyBird,
      progress: hasEarlyBird ? 1 : 0,
      currentValue: hasEarlyBird ? 1 : 0,
      targetValue: 1,
      unit: 'session',
      color: '#F97316',
      category: 'special',
    },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  // XP & Level Progression Calculation
  // 10 XP per minute + 50 XP per completed session + 100 XP per zero-distraction session + 150 XP per streak day
  const totalXp = Math.max(
    50,
    Math.round(totalFocusMins * 10) +
      completed.length * 50 +
      zeroDistractionSessions * 100 +
      streak * 150
  );

  // Level thresholds:
  // Lv 1: 0 - 500 (Digital Apprentice)
  // Lv 2: 501 - 1500 (Focus Practitioner)
  // Lv 3: 1501 - 3500 (Deep Worker)
  // Lv 4: 3501 - 7000 (Mindful Monk)
  // Lv 5: 7001 - 12000 (Focus Specialist)
  // Lv 6+: 12001+ (Focus Grandmaster)
  const tiers = [
    { level: 1, title: 'Digital Apprentice', min: 0, max: 500 },
    { level: 2, title: 'Focus Practitioner', min: 500, max: 1500 },
    { level: 3, title: 'Deep Worker', min: 1500, max: 3500 },
    { level: 4, title: 'Mindful Monk', min: 3500, max: 7000 },
    { level: 5, title: 'Focus Specialist', min: 7000, max: 12000 },
    { level: 6, title: 'Focus Grandmaster', min: 12000, max: 25000 },
  ];

  let currentTier = tiers[0];
  for (const t of tiers) {
    if (totalXp >= t.min) {
      currentTier = t;
    }
  }

  const range = currentTier.max - currentTier.min;
  const currentInTier = Math.max(0, totalXp - currentTier.min);
  const progress = Math.min(1.0, currentInTier / range);

  const levelInfo: FocusLevelInfo = {
    level: currentTier.level,
    rankTitle: currentTier.title,
    totalXp,
    currentLevelXp: currentInTier,
    xpForNextLevel: range,
    progress,
  };

  return {
    badges,
    levelInfo,
    stats,
    unlockedCount,
    totalCount: badges.length,
  };
};

export const saveUserProfile = async (user: UserProfileRecord): Promise<void> => {
  const index = inMemoryUsers.findIndex(u => u.uid === user.uid);
  if (index >= 0) {
    inMemoryUsers[index] = user;
  } else {
    inMemoryUsers.push(user);
  }

  if (sqliteDbInstance) {
    try {
      await sqliteDbInstance.executeSql(
        `INSERT OR REPLACE INTO users (uid, email, display_name, photo_url, created_at)
         VALUES (?, ?, ?, ?, ?);`,
        [user.uid, user.email, user.display_name, user.photo_url || '', user.created_at]
      );
    } catch (e) {
      console.warn('Error saving user profile to SQLite:', e);
    }
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfileRecord | null> => {
  if (sqliteDbInstance) {
    try {
      const [results] = await sqliteDbInstance.executeSql(
        'SELECT * FROM users WHERE uid = ? LIMIT 1;',
        [uid]
      );
      if (results.rows.length > 0) {
        return results.rows.item(0);
      }
    } catch (e) {
      console.warn('Error querying user profile from SQLite:', e);
    }
  }

  return inMemoryUsers.find(u => u.uid === uid) || null;
};

export const getCurrentUserProfile = async (): Promise<UserProfileRecord | null> => {
  // 1. Try SQLite DB last user
  if (sqliteDbInstance) {
    try {
      const [results] = await sqliteDbInstance.executeSql(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT 1;'
      );
      if (results.rows.length > 0) {
        return results.rows.item(0);
      }
    } catch {}
  }

  // 3. Try in-memory users
  if (inMemoryUsers.length > 0) {
    return inMemoryUsers[inMemoryUsers.length - 1];
  }

  return null;
};

export const getBadgesList = (): BadgeItem[] => [];
