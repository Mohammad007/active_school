import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { errorMessage, socialApi } from '@/api';
import { Avatar, Button, contentWidth, EmptyState, ErrorState, Header, ListSkeleton, Screen } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate } from '@/lib/format';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';
import type { BlockedStudent } from '@/types';

export default function BlockedScreen() {
  const q = useQuery(() => socialApi.blocks(), []);
  const [busyId, setBusyId] = useState<number | null>(null);

  const unblock = (s: BlockedStudent) => {
    if (!s.id) return;
    const id = s.id;
    Alert.alert(`Unblock ${s.display_name}?`, 'You will see each other’s posts and comments again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          setBusyId(id);
          try {
            await socialApi.unblock(id);
            q.setData((prev) => prev?.filter((b) => b.id !== id));
          } catch (e) {
            Alert.alert('Could not unblock', errorMessage(e));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header title="Blocked accounts" />
      {q.loading ? (
        <ListSkeleton rows={4} />
      ) : q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={q.reload} />
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(b, i) => String(b.id ?? i)}
          contentContainerStyle={[styles.list, contentWidth]}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListHeaderComponent={
            q.data?.length ? <Text style={styles.lead}>Blocked students can’t see your posts or comment on them, and you won’t see theirs. Points are not affected.</Text> : undefined
          }
          ListEmptyComponent={
            <EmptyState icon="ban-outline" title="No blocked accounts" message="When you block a classmate from their profile, they will appear here." />
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar uri={item.avatar_url} name={item.display_name} size={44} />
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.display_name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.class_label, item.blocked_at ? `Blocked ${formatDate(item.blocked_at)}` : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Button
                label="Unblock"
                size="sm"
                variant="outline"
                onPress={() => unblock(item)}
                loading={busyId === item.id}
                accessibilityLabel={`Unblock ${item.display_name}`}
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: ScreenPadding, paddingBottom: Spacing.xxl, flexGrow: 1 },
  lead: { ...Type.small, color: Colors.muted, marginBottom: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56 },
  sep: { height: Spacing.md },
  body: { flex: 1 },
  name: { ...Type.body, fontWeight: '600', color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted, marginTop: 2 },
});
