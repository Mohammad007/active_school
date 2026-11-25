import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { errorMessage, notificationsApi } from '@/api';
import { ChipBar, contentWidth, EmptyState, ErrorState, Header, ListFooter, ListSkeleton, Screen, Touchable } from '@/components/ui';
import { usePaged } from '@/hooks/usePaged';
import { timeAgo } from '@/lib/format';
import { iconName } from '@/lib/icons';
import { openRoute } from '@/lib/nav';
import { useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';
import type { AppNotification } from '@/types';

/** Tab values match the `tab` column written by App\Services\MobileApp\Notifier. */
type Tab = 'all' | 'activities' | 'challenges' | 'events' | 'rewards' | 'notices';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'activities', label: 'Activity' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'events', label: 'Events' },
  { key: 'rewards', label: 'Rewards' },
  { key: 'notices', label: 'Notices' },
];

const TAB_ICON: Record<string, Parameters<typeof iconName>[1]> = {
  activities: 'images',
  challenges: 'flag',
  events: 'calendar',
  rewards: 'gift',
  notices: 'megaphone',
};

export default function NotificationsScreen() {
  const [tab, setTab] = useState<Tab>('all');
  const unread = useSession((s) => s.unreadCount);
  const setUnread = useSession((s) => s.setUnread);
  const refreshUnread = useSession((s) => s.refreshUnread);
  const [marking, setMarking] = useState(false);

  const list = usePaged<AppNotification>((p) => notificationsApi.list(tab, p.page), [tab]);

  const open = async (n: AppNotification) => {
    if (!n.read) {
      list.setItems((items) => items.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread(useSession.getState().unreadCount - 1);
      notificationsApi.read(n.id).catch(() => undefined);
    }
    openRoute(n.route);
  };

  const readAll = async () => {
    setMarking(true);
    try {
      await notificationsApi.readAll();
      list.setItems((items) => items.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch (e) {
      Alert.alert('Could not update', errorMessage(e));
    } finally {
      setMarking(false);
    }
  };

  const hasUnread = unread > 0 || list.items.some((n) => !n.read);

  return (
    <Screen>
      <Header
        title="Notifications"
        border={false}
        right={
          hasUnread ? (
            <Touchable onPress={readAll} disabled={marking} accessibilityLabel="Mark all as read" style={styles.readAll}>
              <Text style={styles.readAllText}>{marking ? 'Marking…' : 'Mark all read'}</Text>
            </Touchable>
          ) : null
        }
      />
      <View style={styles.tabsWrap}>
        <ChipBar options={TABS} value={tab} onChange={setTab} style={contentWidth} />
      </View>
      <FlatList
        data={list.items}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={[contentWidth, styles.list]}
        renderItem={({ item }) => <NotificationRow n={item} onPress={() => open(item)} />}
        ListEmptyComponent={
          list.loading ? (
            <ListSkeleton rows={7} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : (
            <EmptyState art="yoga" title="You are all caught up" message="Appreciations, reviews, events and rewards will show up here." />
          )
        }
        ListFooterComponent={<ListFooter loading={list.loadingMore} error={list.moreError} onRetry={list.loadMore} />}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={() => {
              refreshUnread();
              return list.refresh();
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />
    </Screen>
  );
}

function NotificationRow({ n, onPress }: { n: AppNotification; onPress: () => void }) {
  const icon = iconName(n.icon, TAB_ICON[n.tab] ?? 'notifications');
  return (
    <Touchable
      scaleTo={0.99}
      onPress={onPress}
      accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}. ${n.body ?? ''}`}
      style={[styles.row, !n.read && styles.rowUnread]}>
      <View style={[styles.icon, !n.read && styles.iconUnread]}>
        <Ionicons name={icon} size={18} color={n.read ? Colors.muted : Colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, !n.read && styles.titleUnread]} numberOfLines={2}>
          {n.title}
        </Text>
        {n.body ? (
          <Text style={styles.text} numberOfLines={3}>
            {n.body}
          </Text>
        ) : null}
        <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
      </View>
      {!n.read ? <View style={styles.dot} accessibilityElementsHidden /> : null}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { backgroundColor: Colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  list: { paddingBottom: Spacing.xxl },
  readAll: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.md },
  readAllText: { ...Type.small, fontWeight: '600', color: Colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: ScreenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  rowUnread: { backgroundColor: Colors.primaryTint },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceAlt },
  iconUnread: { backgroundColor: Colors.surface },
  body: { flex: 1, gap: 2 },
  title: { ...Type.body, color: Colors.body },
  titleUnread: { fontWeight: '600', color: Colors.ink },
  text: { ...Type.small, color: Colors.muted },
  time: { ...Type.caption, color: Colors.subtle, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: Spacing.sm },
});
