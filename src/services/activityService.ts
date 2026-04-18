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
      timestamp: serverTimestamp(),
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
  } catch (err) {
    console.error('[ActivityService] Failed to fetch stats:', err);
    return null;
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
