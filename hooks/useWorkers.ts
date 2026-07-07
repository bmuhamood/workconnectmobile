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

function mapWorker(row: any): WorkerProfile {
  return { ...row, full_name: `${row.first_name} ${row.last_name}`.trim() };
}

export function useWorkers() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const searchWorkers = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      let query = supabase.from('worker_profiles').select('*').order('rating_average', { ascending: false }).limit(50);
      if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,profession.ilike.%${search}%`);
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
