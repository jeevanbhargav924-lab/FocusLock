import { Platform, NativeModules } from 'react-native';

export interface SessionRecord {
  id: string;
  user_id: string;
  title: string;
  category: string; // 'reading' | 'coding' | 'journaling' | 'general'
  start_time: string; // ISO or formatted
  end_time: string;
  planned_minutes: number;
  actual_minutes: number;
  status: 'completed' | 'interrupted';
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
  } catch (e) {
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
          return {
            id: item.id || `s-${Date.now()}`,
            user_id: userId,
            title: item.title || 'Focus Session',
            category: 'coding',
            start_time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            end_time: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            planned_minutes: item.duration_minutes || 25,
            actual_minutes: item.duration_minutes || 25,
            status: item.status === 'active' ? 'completed' : (item.status || 'completed'),
            score: 100,
            blocked_attempts: 0,
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

  return {
    user_id: userId,
    current_streak: streak,
    longest_session_mins: longestSession,
    most_hours_in_day: parseFloat((maxDailyMins / 60).toFixed(1)),
    total_focus_hours: parseFloat((totalMins / 60).toFixed(1)),
    unlocked_badges_count: 0,
    total_badges_count: 0,
  };
};

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  color: string;
}

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
  // 1. Try Firebase auth currentUser first if logged in
  try {
    const authModule = require('@react-native-firebase/auth');
    const authInst = typeof authModule.default === 'function' ? authModule.default() : typeof authModule === 'function' ? authModule() : null;
    const user = authInst?.currentUser;
    if (user) {
      return {
        uid: user.uid,
        email: user.email || '',
        display_name: user.displayName || (user.email ? user.email.split('@')[0] : 'Focus User'),
        photo_url: user.photoURL || '',
        created_at: Date.now(),
      };
    }
  } catch (e) {}

  // 2. Try SQLite DB last user
  if (sqliteDbInstance) {
    try {
      const [results] = await sqliteDbInstance.executeSql(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT 1;'
      );
      if (results.rows.length > 0) {
        return results.rows.item(0);
      }
    } catch (e) {}
  }

  // 3. Try in-memory users
  if (inMemoryUsers.length > 0) {
    return inMemoryUsers[inMemoryUsers.length - 1];
  }

  return null;
};

export const getBadgesList = (): BadgeItem[] => [];
