// app/profile.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Input, LoadingView, Screen } from '../components/ui';
import { colors, radius, spacing } from '../constants/theme';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const AVAILABILITY_OPTIONS = [
  { label: 'Available', value: 'available' },
  { label: 'Full-time', value: 'full_time' },
  { label: 'Part-time', value: 'part_time' },
  { label: 'Flexible', value: 'flexible' },
  { label: 'Unavailable', value: 'unavailable' },
];

const PROFICIENCY_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' },
];

interface Skill {
  skill_name: string;
  proficiency_level: string;
  years_of_experience: number;
  is_primary: boolean;
}

type Section = 'basic' | 'professional' | 'skills';

export default function ProfileEditScreen() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('basic');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date_of_birth: '',
    gender: '',
    national_id: '',
    city: '',
    district: '',
    profession: '',
    experience_years: '0',
    education_level: '',
    bio: '',
    hourly_rate: '0',
    availability: 'available',
    expected_salary_min: '',
    expected_salary_max: '',
  });

  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('intermediate');
  const [newSkillYears, setNewSkillYears] = useState('0');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase.from('worker_profiles').select('*').eq('user_id', user.id).single();
      if (profile) {
        setProfileId(profile.id);
        setForm({
          date_of_birth: profile.date_of_birth ?? '',
          gender: profile.gender ?? '',
          national_id: profile.national_id ?? '',
          city: profile.city ?? '',
          district: profile.district ?? '',
          profession: profile.profession ?? '',
          experience_years: String(profile.experience_years ?? 0),
          education_level: profile.education_level ?? '',
          bio: profile.bio ?? '',
          hourly_rate: String(profile.hourly_rate ?? 0),
          availability: profile.availability ?? 'available',
          expected_salary_min: profile.expected_salary_min ? String(profile.expected_salary_min) : '',
          expected_salary_max: profile.expected_salary_max ? String(profile.expected_salary_max) : '',
        });
        const { data: skillRows } = await supabase.from('worker_skills').select('*').eq('worker_id', profile.id);
        setSkills(
          (skillRows ?? []).map((s: any) => ({
            skill_name: s.skill_name,
            proficiency_level: s.proficiency_level,
            years_of_experience: s.years_of_experience,
            is_primary: s.is_primary,
          }))
        );
      }
      setLoading(false);
    })();
  }, [user]);

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const addSkill = () => {
    if (!newSkillName.trim()) {
      Toast.show({ type: 'error', text1: 'Enter a skill name' });
      return;
    }
    setSkills((prev) => [
      ...prev,
      { skill_name: newSkillName.trim(), proficiency_level: newSkillProficiency, years_of_experience: Number(newSkillYears) || 0, is_primary: prev.length === 0 },
    ]);
    setNewSkillName('');
    setNewSkillProficiency('intermediate');
    setNewSkillYears('0');
  };

  const removeSkill = (index: number) => setSkills((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!profileId) {
      Toast.show({ type: 'error', text1: 'Profile not found' });
      return;
    }
    setSaving(true);
    try {
      const { error: profileErr } = await supabase
        .from('worker_profiles')
        .update({
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          national_id: form.national_id || null,
          city: form.city,
          district: form.district || null,
          profession: form.profession,
          experience_years: Number(form.experience_years) || 0,
          education_level: form.education_level || null,
          bio: form.bio || null,
          hourly_rate: Number(form.hourly_rate) || 0,
          availability: form.availability,
          expected_salary_min: form.expected_salary_min ? Number(form.expected_salary_min) : null,
          expected_salary_max: form.expected_salary_max ? Number(form.expected_salary_max) : null,
        } as any)
        .eq('id', profileId);
      if (profileErr) throw profileErr;

      // Skills: replace-all, same approach as web — falls back to a
      // "General" category since this UI doesn't require picking one
      // per skill.
      const { data: categories } = await supabase.from('job_categories').select('id, name');
      const fallbackCategoryId = categories?.find((c: any) => /general/i.test(c.name))?.id ?? categories?.[0]?.id;

      await supabase.from('worker_skills').delete().eq('worker_id', profileId);
      if (skills.length > 0 && fallbackCategoryId) {
        const rows = skills.map((s) => ({
          worker_id: profileId,
          category_id: fallbackCategoryId,
          skill_name: s.skill_name,
          proficiency_level: s.proficiency_level,
          years_of_experience: s.years_of_experience,
          is_primary: s.is_primary,
        }));
        const { error: skillsErr } = await supabase.from('worker_skills').insert(rows as any);
        if (skillsErr) throw skillsErr;
      }

      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to save', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Edit Profile' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.tabs}>
          {(['basic', 'professional', 'skills'] as Section[]).map((s) => (
            <Pressable key={s} style={[styles.tab, section === s && styles.tabActive]} onPress={() => setSection(s)}>
              <Text style={[styles.tabText, section === s && styles.tabTextActive]}>
                {s === 'basic' ? 'Basic Info' : s === 'professional' ? 'Professional' : 'Skills'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {section === 'basic' && (
            <>
              <Input label="Date of Birth" placeholder="YYYY-MM-DD" value={form.date_of_birth} onChangeText={(v) => update('date_of_birth', v)} />
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.chipsRow}>
                {GENDER_OPTIONS.map((opt) => (
                  <Pressable key={opt.value} style={[styles.chip, form.gender === opt.value && styles.chipActive]} onPress={() => update('gender', opt.value)}>
                    <Text style={[styles.chipText, form.gender === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Input label="National ID" value={form.national_id} onChangeText={(v) => update('national_id', v)} />
              <Input label="City" value={form.city} onChangeText={(v) => update('city', v)} />
              <Input label="District" value={form.district} onChangeText={(v) => update('district', v)} />
            </>
          )}

          {section === 'professional' && (
            <>
              <Input label="Profession" value={form.profession} onChangeText={(v) => update('profession', v)} placeholder="e.g. Nanny, Driver, Gardener" />
              <Input label="Years of Experience" keyboardType="numeric" value={form.experience_years} onChangeText={(v) => update('experience_years', v)} />
              <Input label="Education Level" value={form.education_level} onChangeText={(v) => update('education_level', v)} />
              <Input label="Bio" value={form.bio} onChangeText={(v) => update('bio', v)} multiline numberOfLines={4} style={{ height: 96, textAlignVertical: 'top' }} />
              <Input label="Hourly Rate (UGX)" keyboardType="numeric" value={form.hourly_rate} onChangeText={(v) => update('hourly_rate', v)} />

              <Text style={styles.fieldLabel}>Availability</Text>
              <View style={styles.chipsRow}>
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <Pressable key={opt.value} style={[styles.chip, form.availability === opt.value && styles.chipActive]} onPress={() => update('availability', opt.value)}>
                    <Text style={[styles.chipText, form.availability === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Input label="Expected Min Salary (UGX)" keyboardType="numeric" value={form.expected_salary_min} onChangeText={(v) => update('expected_salary_min', v)} />
              <Input label="Expected Max Salary (UGX)" keyboardType="numeric" value={form.expected_salary_max} onChangeText={(v) => update('expected_salary_max', v)} />
            </>
          )}

          {section === 'skills' && (
            <>
              {skills.map((s, i) => (
                <Card key={`${s.skill_name}-${i}`} style={{ marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={styles.skillName}>{s.skill_name}{s.is_primary ? ' · Primary' : ''}</Text>
                      <Text style={styles.skillMeta}>{s.proficiency_level} · {s.years_of_experience} yrs</Text>
                    </View>
                    <Pressable onPress={() => removeSkill(i)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                </Card>
              ))}

              <Card>
                <Text style={styles.fieldLabel}>Add a skill</Text>
                <Input placeholder="Skill name" value={newSkillName} onChangeText={setNewSkillName} />
                <View style={styles.chipsRow}>
                  {PROFICIENCY_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[styles.chip, newSkillProficiency === opt.value && styles.chipActive]}
                      onPress={() => setNewSkillProficiency(opt.value)}
                    >
                      <Text style={[styles.chipText, newSkillProficiency === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Input label="Years of experience" keyboardType="numeric" value={newSkillYears} onChangeText={setNewSkillYears} />
                <Button title="Add Skill" variant="outline" onPress={addSkill} />
              </Card>
            </>
          )}

          <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, paddingTop: spacing.sm },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.white },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  skillName: { fontSize: 15, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  skillMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
});
