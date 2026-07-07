// hooks/useJobs.ts
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  salary_min: number;
  salary_max: number;
  status: string;
  is_featured: boolean;
  created_at: string;
  employer: { id: string; company_name: string };
  category_name?: string;
}

const SELECT = `*, employer_profiles ( id, company_name, first_name, last_name ), job_categories ( name )`;

function mapJob(row: any): JobPosting {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requirements: row.requirements,
    location: row.location,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    status: row.status,
    is_featured: row.is_featured,
    created_at: row.created_at,
    employer: {
      id: row.employer_profiles?.id ?? row.employer_id,
      company_name:
        row.employer_profiles?.company_name ||
        `${row.employer_profiles?.first_name ?? ''} ${row.employer_profiles?.last_name ?? ''}`.trim() ||
        'Employer',
    },
    category_name: row.job_categories?.name,
  };
}

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      let query = supabase.from('job_postings').select(SELECT).eq('status', 'active').order('created_at', { ascending: false }).limit(50);
      if (search) query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      setJobs((data ?? []).map(mapJob));
    } catch (err) {
      console.error('fetchJobs error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobById = useCallback(async (id: string): Promise<JobPosting | null> => {
    const { data, error } = await supabase.from('job_postings').select(SELECT).eq('id', id).single();
    if (error || !data) return null;
    supabase.rpc('increment_job_views', { job_id: id }).then(() => {});
    return mapJob(data);
  }, []);

  const applyForJob = useCallback(
    async (jobId: string, coverLetter?: string) => {
      if (!user) throw new Error('Please log in to apply');
      const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).single();
      if (!workerProfile) throw new Error('Only workers can apply for jobs');

      const { error } = await supabase
        .from('job_applications')
        .insert({ job_posting_id: jobId, worker_id: workerProfile.id, cover_letter: coverLetter || '' } as any);
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          throw new Error("You've already applied to this job.");
        }
        throw new Error(error.message || 'Failed to submit your application. Please try again.');
      }
    },
    [user]
  );

  const createJobPosting = useCallback(
    async (jobData: {
      title: string; description: string; requirements?: string;
      salary_min: number; salary_max: number; location: string;
      category_id: string; work_schedule?: string; start_date?: string;
    }) => {
      if (!user) throw new Error('Please log in');
      let { data: employerProfile } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!employerProfile && (user.role === 'admin' || user.role === 'super_admin')) {
        const { data: created, error: createErr } = await supabase
          .from('employer_profiles')
          .insert({ user_id: user.id, first_name: user.first_name, last_name: user.last_name, company_name: 'WorkConnect', city: 'Kampala', id_verified: true } as any)
          .select('id')
          .single();
        if (createErr) throw createErr;
        employerProfile = created;
      }
      if (!employerProfile) throw new Error('Only employers can post jobs');

      const { data, error } = await supabase
        .from('job_postings')
        .insert({ ...jobData, employer_id: employerProfile.id, status: 'draft' } as any)
        .select(SELECT)
        .single();
      if (error) throw error;
      return mapJob(data);
    },
    [user]
  );

  const fetchEmployerJobs = useCallback(async () => {
    if (!user) return [];
    const { data: employerProfile } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (!employerProfile) return [];
    const { data, error } = await supabase.from('job_postings').select(SELECT).eq('employer_id', employerProfile.id).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapJob);
  }, [user]);

  const updateJobStatus = useCallback(async (jobId: string, status: string) => {
    const { error } = await supabase.from('job_postings').update({ status } as any).eq('id', jobId);
    if (error) throw error;
  }, []);

  return { jobs, loading, fetchJobs, fetchJobById, applyForJob, createJobPosting, fetchEmployerJobs, updateJobStatus };
}

export function useSavedJobs() {
  const { user } = useAuth();
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  const fetchSavedJobIds = useCallback(async () => {
    if (!user) return;
    const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (!workerProfile) return;
    const { data } = await supabase.from('saved_jobs').select('job_posting_id').eq('worker_id', workerProfile.id);
    setSavedJobIds((data ?? []).map((r: any) => r.job_posting_id));
  }, [user]);

  const toggleSaveJob = useCallback(
    async (jobId: string) => {
      if (!user) throw new Error('Please log in to save jobs');
      const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).single();
      if (!workerProfile) throw new Error('Only workers can save jobs');

      if (savedJobIds.includes(jobId)) {
        const { error } = await supabase.from('saved_jobs').delete().eq('worker_id', workerProfile.id).eq('job_posting_id', jobId);
        if (error) throw new Error('Failed to remove this saved job. Please try again.');
        setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
        return false;
      } else {
        const { error } = await supabase.from('saved_jobs').insert({ worker_id: workerProfile.id, job_posting_id: jobId } as any);
        if (error && error.code !== '23505') {
          // 23505 (duplicate key) means it's already saved — treat as success rather than erroring
          throw new Error('Failed to save this job. Please try again.');
        }
        setSavedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
        return true;
      }
    },
    [user, savedJobIds]
  );

  const fetchSavedJobs = useCallback(async () => {
    if (!user) return [];
    const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (!workerProfile) return [];
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id, created_at, job_postings ( *, employer_profiles ( company_name, first_name, last_name ) )')
      .eq('worker_id', workerProfile.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }, [user]);

  return { savedJobIds, fetchSavedJobIds, toggleSaveJob, fetchSavedJobs };
}
