// app/documents.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Badge, Button, Card, EmptyState, LoadingView, Screen } from '../components/ui';
import { colors, formatDate, spacing } from '../constants/theme';

const DOC_TYPE = 'national_id';

export default function DocumentsScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (!workerProfile) { setLoading(false); return; }
    setWorkerId(workerProfile.id);
    const { data } = await supabase.from('worker_documents').select('*').eq('worker_id', workerProfile.id).order('uploaded_at', { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleUpload = async () => {
    if (!workerId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission is needed to upload a document' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const base64 = asset.base64 ?? (await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 }));
      const fileExt = asset.uri.split('.').pop() || 'jpg';
      const path = `${user!.id}/${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage.from('worker-documents').upload(path, decode(base64), {
        contentType: asset.mimeType || 'image/jpeg',
      });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = await supabase.storage.from('worker-documents').createSignedUrl(path, 60 * 60 * 24 * 365);

      const { error: insertErr } = await supabase.from('worker_documents').insert({
        worker_id: workerId,
        document_type: DOC_TYPE,
        document_file_url: urlData?.signedUrl ?? path,
        status: 'pending',
        uploaded_by: user!.id,
      } as any);
      if (insertErr) throw insertErr;

      Toast.show({ type: 'success', text1: 'Document uploaded — pending review' });
      load();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (docId: string) => {
    Alert.alert('Delete document', 'Remove this document? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('worker_documents').delete().eq('id', docId);
          if (!error) setDocuments((prev) => prev.filter((d) => d.id !== docId));
        },
      },
    ]);
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'My Documents' }} />
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Button title="Upload National ID" onPress={handleUpload} loading={uploading} />
      </View>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={<EmptyState title="No documents uploaded" subtitle="Upload your National ID for verification." icon="document-attach-outline" />}
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.docType}>{item.document_type.replace(/_/g, ' ')}</Text>
              <Text style={styles.date}>Uploaded {formatDate(item.uploaded_at)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Badge
                text={item.status}
                tone={item.status === 'verified' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}
              />
              {item.status === 'pending' && (
                <Text onPress={() => handleDelete(item.id)} style={styles.deleteLink}>
                  Delete
                </Text>
              )}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  docType: { fontSize: 15, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  deleteLink: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
