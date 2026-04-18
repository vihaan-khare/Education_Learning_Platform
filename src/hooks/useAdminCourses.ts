/**
 * useAdminCourses.ts
 *
 * Fetches admin-uploaded content from Firestore for a given disability profile.
 * Courses live at: courses/{profile}/items/{itemId}
 *
 * Returns an array of AdminCourse objects ready to be injected into any
 * learning module's catalogue.
 */

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  url: string;
  contentType: 'game_url' | 'video_url' | 'text_content' | 'external_link';
  uploadedAt: number;
  uploadedBy: string;
  classifiedReason: string;
  assignments?: string[];
}

export function useAdminCourses(profile: string) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const fetchCourses = async () => {
      try {
        const ref = collection(db, 'courses', profile, 'items');
        const q = query(ref, orderBy('uploadedAt', 'desc'));
        const snap = await getDocs(q);
        const items: AdminCourse[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<AdminCourse, 'id'>),
        }));
        setCourses(items);
      } catch (err: any) {
        console.error(`[useAdminCourses] Failed to fetch courses for "${profile}":`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [profile]);

  return { courses, loading, error };
}
