import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { publicApi } from '@/api';
import { Button, ErrorState, Header, Screen, Skeleton, contentWidth } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate, stripHtml } from '@/lib/format';
import { openUrl } from '@/lib/nav';
import { useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';

const TITLES: Record<string, string> = { terms: 'Terms of use', privacy: 'Privacy policy' };

/** CMS page from the website (GET /pages/{slug}) — terms and privacy. */
export default function SitePageScreen() {
  const { slug: raw } = useLocalSearchParams<{ slug: string }>();
  const slug = String(raw ?? '');
  const links = useSession((s) => s.config?.links);
  const page = useQuery(() => publicApi.page(slug), [slug], { enabled: !!slug });
  const webUrl = slug === 'terms' ? links?.terms : slug === 'privacy' ? links?.privacy : links?.website;

  return (
    <Screen background={Colors.surface}>
      <Header title={page.data?.title ?? TITLES[slug] ?? 'ActiveSchool'} />
      {page.loading ? (
        <View style={[styles.body, contentWidth]}>
          <Skeleton width="60%" height={20} />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} width={`${95 - (i % 3) * 12}%`} height={12} />
          ))}
        </View>
      ) : page.error ? (
        <View style={styles.flex}>
          <ErrorState error={page.error} onRetry={page.reload} />
          {webUrl ? <Button label="Open on website" variant="ghost" onPress={() => openUrl(webUrl)} style={styles.web} /> : null}
        </View>
      ) : page.data ? (
        <ScrollView
          contentContainerStyle={[styles.body, contentWidth]}
          refreshControl={<RefreshControl refreshing={page.refreshing} onRefresh={page.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
          <Text style={styles.title} accessibilityRole="header">
            {page.data.title}
          </Text>
          {page.data.updated_at ? <Text style={styles.updated}>Last updated {formatDate(page.data.updated_at)}</Text> : null}
          <Text style={styles.text} selectable>
            {stripHtml(page.data.body)}
          </Text>
          {webUrl ? <Button label="Open on website" variant="ghost" icon="open-outline" onPress={() => openUrl(webUrl)} /> : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: ScreenPadding, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { ...Type.title, color: Colors.ink },
  updated: { ...Type.caption, color: Colors.muted, marginTop: -Spacing.xs },
  text: { ...Type.bodyLg, color: Colors.body },
  web: { alignSelf: 'center' },
});
