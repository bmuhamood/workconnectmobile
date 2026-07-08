// hooks/useWorkers.ts
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface WorkerProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profession: string;
  city: string;
  experience_years: number;
  hourly_rate: number;
  rating_average: number;
  verification_status: string;
  bio?: string;
  profile_photo_url?: string;
}

export interface WorkerFilters {
  search?: string;
  profession?: string;
  city?: string;
  availability?: string;
  min_rating?: number;
  min_experience?: number;
}

function mapWorker(row: any): WorkerProfile {
  return { ...row, full_name: `${row.first_name} ${row.last_name}`.trim() };
}

export function useWorkers() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const searchWorkers = useCallback(async (filters: WorkerFilters = {}) => {
    setLoading(true);
    try {
      let query = supabase.from('worker_profiles').select('*').order('rating_average', { ascending: false }).limit(50);
      if (filters.search) query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,profession.ilike.%${filters.search}%`);
      if (filters.profession) query = query.ilike('profession', `%${filters.profession}%`);
      if (filters.city) query = query.ilike('city', `%${filters.city}%`);
      if (filters.availability) query = query.eq('availability', filters.availability as any);
      if (filters.min_rating) query = query.gte('rating_average', filters.min_rating);
      if (filters.min_experience) query = query.gte('experience_years', filters.min_experience);
      const { data, error } = await query;
      if (error) throw error;
      setWorkers((data ?? []).map(mapWorker));
    } catch (err) {
      console.error('searchWorkers error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkerProfile = useCallback(async (id: string): Promise<WorkerProfile | null> => {
    const { data, error } = await supabase.from('worker_profiles').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapWorker(data);
  }, []);

  return { workers, loading, searchWorkers, fetchWorkerProfile };
}
