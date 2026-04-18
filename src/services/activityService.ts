/**
 * activityService.ts
 *
 * Manages persistent student activity tracking in Firestore.
 * Stores completed lessons, assignments, and time spent per session.
 * All data lives under: activity/{userId}/sessions/{auto-id}
 */

import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface ActivityEntry {
  courseId: string;
  courseName: string;
  section: string;
  action: 'lesson_complete' | 'assignment_complete' | 'course_complete' | 'page_visit';
  timestamp: any;
  timeSpent?: number; // seconds
}

export interface UserStats {
  name: string;
  email: string;
  disabilityProfile: string | null;
  totalActivities: number;
  recentActivity: ActivityEntry[];
}

/**
 * Log a student activity to Firestore.
 */
export async function logActivity(
  courseId: string,
  courseName: string,
  section: string,
  action: ActivityEntry['action'],
  timeSpent?: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const sessionsRef = collection(db, 'activity', user.uid, 'sessions');
    await addDoc(sessionsRef, {
      courseId,
      courseName,
      section,
      action,
      timeSpent: timeSpent || 0,
      timestamp: Date.now(), // Use explicit timestamp to prevent 'null' query drop on local cache
    });
  } catch (err) {
    console.error('[ActivityService] Failed to log activity:', err);
  }
}

/**
 * Fetch the last N activities for the current user.
 */
export async function getRecentActivity(count: number = 10): Promise<ActivityEntry[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const sessionsRef = collection(db, 'activity', user.uid, 'sessions');
    const q = query(sessionsRef, orderBy('timestamp', 'desc'), limit(count));
    const snap = await getDocs(q);

    return snap.docs.map(d => d.data() as ActivityEntry);
  } catch (err) {
    console.error('[ActivityService] Failed to fetch activity:', err);
    return [];
  }
}

/**
 * Fetch combined user stats for the Home Page.
 */
export async function getUserStats(): Promise<UserStats | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    // Get user profile
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data() || {};

    // Get recent activity
    const recent = await getRecentActivity(15);

    return {
      name: userData.name || user.email?.split('@')[0] || 'Student',
      email: user.email || '',
      disabilityProfile: userData.disabilityProfile || null,
      totalActivities: recent.length,
      recentActivity: recent,
    };
  } catch (err: any) {
    console.error('[ActivityService] Failed to fetch stats:', err);
    throw new Error(err.message || 'Failed to fetch user database profile. Please check Firestore Rules.');
  }
}

/**
 * Update the user's lastActiveAt timestamp.
 */
export async function updateLastActive(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await updateDoc(doc(db, 'users', user.uid), {
      lastActiveAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[ActivityService] Failed to update lastActive:', err);
  }
}

/**
 * Save the serialized game state mapping to a user document
 */
export async function saveGameState(stateString: string, mode: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const fieldName = mode === 'adhd' ? 'gameStateADHD' : 'gameStateDyslexia';
    await updateDoc(doc(db, 'users', user.uid), {
      [fieldName]: stateString
    });
  } catch (err) {
    console.error('[ActivityService] Failed to save game state:', err);
  }
}

/**
 * Fetch the serialized game state mapping from a user document
 */
export async function getGameState(mode: string): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const data = userDoc.data() || {};
    const fieldName = mode === 'adhd' ? 'gameStateADHD' : 'gameStateDyslexia';
    return typeof data[fieldName] === 'string' ? data[fieldName] : null;
  } catch (err) {
    console.error('[ActivityService] Failed to load game state:', err);
    return null;
  }
}

// =====================================================================
// ADMIN SERVICE FUNCTIONS
// =====================================================================

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  disabilityProfile: string | null;
  lastActiveAt: any;
  age?: number;
}

export interface GlobalActivityEntry extends ActivityEntry {
  userId: string;
  userName: string;
}

/**
 * Fetch all registered users from Firestore (Admin only).
 */
export async function getAllUsers(): Promise<AdminUser[]> {
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);

    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid: d.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        disabilityProfile: data.disabilityProfile || null,
        lastActiveAt: data.lastActiveAt || null,
        age: data.age || undefined,
      };
    });
  } catch (err) {
    console.error('[ActivityService] Failed to fetch all users:', err);
    return [];
  }
}

/**
 * Fetch the most recent activities across ALL users (Admin only).
 */
export async function getGlobalActivity(maxUsers: number = 50): Promise<GlobalActivityEntry[]> {
  try {
    const activityRoot = collection(db, 'activity');
    const activitySnap = await getDocs(activityRoot);

    const allEntries: GlobalActivityEntry[] = [];
    const userIds = activitySnap.docs.map(d => d.id).slice(0, maxUsers);

    for (const userId of userIds) {
      let userName = userId;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          userName = userDoc.data().name || userDoc.data().email || userId;
        }
      } catch (_) {}

      const sessionsRef = collection(db, 'activity', userId, 'sessions');
      const q = query(sessionsRef, orderBy('timestamp', 'desc'), limit(5));
      const sessionsSnap = await getDocs(q);

      sessionsSnap.docs.forEach(d => {
        const data = d.data() as ActivityEntry;
        allEntries.push({ ...data, userId, userName });
      });
    }

    allEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return allEntries.slice(0, 50);
  } catch (err) {
    console.error('[ActivityService] Failed to fetch global activity:', err);
    return [];
  }
}
