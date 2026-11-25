import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { competitionApi } from '@/api';
import { ErrorState, Loading, Sheet } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { Colors, Radius, Spacing, Type } from '@/theme';
import type { ActivityLevel, ActivityResult } from '@/types';

const LEVELS: ActivityLevel[] = ['local', 'district', 'state', 'national'];
const RESULTS: ActivityResult[] = ['participation', 'third', 'second', 'first'];

/** "How points work" — GET /scoring-rules in a bottom sheet. */
export function ScoringRulesSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const q = useQuery(() => competitionApi.rules(), [], { enabled: visible });
  const rules = q.data;

  return (
    <Sheet visible={visible} onClose={onClose} title="How points work">
      {q.loading ? (
        <Loading style={styles.loading} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.reload} compact />
      ) : rules ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {rules.season ? (
            <Text style={styles.meta}>
              {rules.season.name} · rules version {rules.version}
            </Text>
          ) : null}

          <View style={styles.table} accessibilityLabel="Points table">
            <View style={[styles.tr, styles.thead]}>
              <Text style={[styles.th, styles.firstCol]}>Level</Text>
              {RESULTS.map((r) => (
                <Text key={r} style={styles.th} numberOfLines={2}>
                  {(rules.results[r] ?? r).replace(' Place', '')}
                </Text>
              ))}
            </View>
            {LEVELS.map((l, i) => (
              <View key={l} style={[styles.tr, i < LEVELS.length - 1 && styles.trBorder]}>
                <Text style={[styles.td, styles.firstCol, styles.levelName]}>{rules.levels[l] ?? l}</Text>
                {RESULTS.map((r) => (
                  <Text key={r} style={styles.td}>
                    {rules.table[l]?.[r] ?? '–'}
                  </Text>
                ))}
              </View>
            ))}
          </View>

          <Text style={styles.h}>Good to know</Text>
          {rules.notes.map((n) => (
            <Text key={n} style={styles.li}>
              •  {n}
            </Text>
          ))}

          <Text style={styles.h}>Eligibility</Text>
          <Text style={styles.p}>{rules.eligibility}</Text>

          <Text style={styles.h}>Tie-breaks, in order</Text>
          {rules.tie_break.map((t, i) => (
            <Text key={t} style={styles.li}>
              {i + 1}.  {t}
            </Text>
          ))}
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  loading: { minHeight: 200 },
  body: { paddingBottom: Spacing.lg, gap: Spacing.xs },
  meta: { ...Type.caption, color: Colors.muted, marginBottom: Spacing.sm },
  table: { borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline, borderRadius: Radius.md, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center', minHeight: 38 },
  trBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  thead: { backgroundColor: Colors.primaryTint },
  th: { flex: 1, ...Type.micro, color: Colors.primary, textAlign: 'center', paddingVertical: Spacing.sm, paddingHorizontal: 2 },
  td: { flex: 1, ...Type.small, color: Colors.ink, textAlign: 'center', fontWeight: '600' },
  firstCol: { flex: 1.3, textAlign: 'left', paddingLeft: Spacing.md },
  levelName: { fontWeight: '500', color: Colors.body },
  h: { ...Type.subheading, color: Colors.ink, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  p: { ...Type.body, color: Colors.body },
  li: { ...Type.body, color: Colors.body },
});
