import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage, fieldErrors, publicApi } from '@/api';
import { StepIntro } from '@/components/auth/OnboardingParts';
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  ListFooter,
  ListSkeleton,
  Screen,
  Sheet,
  TextField,
  Touchable,
  contentWidth,
} from '@/components/ui';
import { usePaged } from '@/hooks/usePaged';
import { go, goReplace } from '@/lib/nav';
import { useOnboarding } from '@/stores/onboarding';
import { useSession } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { School } from '@/types';

/** Onboarding step 1: find your school (GET /schools?search=). */
export default function SelectSchool() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const selected = useOnboarding((s) => s.school);
  const setOnboarding = useOnboarding((s) => s.set);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text]);

  const list = usePaged(({ page }) => publicApi.schools(query, page), [query]);

  const choose = (s: School) => {
    if (selected?.id !== s.id) setOnboarding({ school: { id: s.id, name: s.name, city: s.city }, schoolClass: null });
  };

  const signOut = () =>
    Alert.alert('Sign out?', 'You can finish setting up later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await useSession.getState().signOut();
          goReplace('/welcome');
        },
      },
    ]);

  return (
    <Screen background={Colors.surface}>
      <Header
        back={router.canGoBack()}
        title="Your school"
        right={<Button label="Sign out" variant="ghost" size="sm" onPress={signOut} />}
      />
      <View style={[styles.top, contentWidth]}>
        <StepIntro step={1} title="Find Your School" subtitle="Search for your school and select it from the list." />
        <TextField
          icon="search"
          placeholder="Search schools"
          value={text}
          onChangeText={setText}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search schools"
        />
      </View>
      {list.loading ? (
        <ListSkeleton rows={6} avatar={false} />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={[styles.list, contentWidth]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => {
            const on = selected?.id === item.id;
            return (
              <Touchable
                onPress={() => choose(item)}
                scaleTo={0.99}
                accessibilityLabel={`${item.name}${item.city ? `, ${item.city}` : ''}`}
                accessibilityState={{ selected: on }}
                style={[styles.row, on && styles.rowOn]}>
                <View style={styles.icon}>
                  <Ionicons name="school-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[item.city, item.state, item.code ? `Code ${item.code}` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? Colors.primary : Colors.subtle} />
              </Touchable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              art="running"
              title={query ? 'No schools found' : 'No schools yet'}
              message={query ? `Nothing matches “${query}”. Check the spelling or ask us to add your school.` : 'Ask us to add your school.'}
              compact
            />
          }
          ListFooterComponent={
            <View>
              <ListFooter loading={list.loadingMore} error={list.moreError} onRetry={list.loadMore} />
              <Touchable onPress={() => setRequestOpen(true)} style={styles.request} accessibilityLabel="Can't find my school? Request it">
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.requestText}>Can’t find your school? Request it</Text>
              </Touchable>
            </View>
          }
        />
      )}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={contentWidth}>
          <Button label="Next" iconRight="arrow-forward" onPress={() => go('/student-details')} disabled={!selected} />
        </View>
      </View>
      <RequestSchoolSheet visible={requestOpen} onClose={() => setRequestOpen(false)} initialName={text} />
    </Screen>
  );
}

function RequestSchoolSheet({ visible, onClose, initialName }: { visible: boolean; onClose: () => void; initialName: string }) {
  const [form, setForm] = useState({ school_name: '', city: '', state: '', contact: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm((f) => ({ ...f, school_name: f.school_name || initialName.trim() }));
      setDone(false);
      setErrors({});
    }
  }, [visible, initialName]);

  const submit = async () => {
    if (form.school_name.trim().length < 3) {
      setErrors({ school_name: 'Enter the full school name.' });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      await publicApi.requestSchool({
        school_name: form.school_name.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        contact: form.contact.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      const f = fieldErrors(e);
      if (Object.keys(f).length) setErrors(f);
      else Alert.alert('Could not send request', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={done ? 'Request sent' : 'Request your school'}>
      {done ? (
        <View style={styles.sheetBody}>
          <Text style={styles.sheetText}>
            Thanks! Our team will check “{form.school_name.trim()}” and add it once your school is verified. Search again later to finish setting up.
          </Text>
          <Button label="Done" onPress={onClose} />
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
          <Text style={styles.sheetText}>Schools are added after a quick check by the ActiveSchool team.</Text>
          <TextField label="School name" value={form.school_name} onChangeText={(v) => setForm({ ...form, school_name: v })} error={errors.school_name} maxLength={200} />
          <View style={styles.pair}>
            <View style={styles.flex}>
              <TextField label="City" optional value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} error={errors.city} maxLength={100} />
            </View>
            <View style={styles.flex}>
              <TextField label="State" optional value={form.state} onChangeText={(v) => setForm({ ...form, state: v })} error={errors.state} maxLength={100} />
            </View>
          </View>
          <TextField
            label="Your contact"
            optional
            placeholder="Phone or email, so we can update you"
            value={form.contact}
            onChangeText={(v) => setForm({ ...form, contact: v })}
            error={errors.contact}
            maxLength={120}
          />
          <Button label="Send request" onPress={submit} loading={busy} />
        </ScrollView>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.md },
  list: { paddingHorizontal: ScreenPadding, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    minHeight: 60,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  rowOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryTint },
  icon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  name: { ...Type.body, fontWeight: '600', color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted, marginTop: 2 },
  request: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, minHeight: 48, marginTop: Spacing.sm },
  requestText: { ...Type.body, fontWeight: '600', color: Colors.primary },
  sheetBody: { gap: Spacing.md, paddingBottom: Spacing.sm },
  footer: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.hairline, backgroundColor: Colors.surface },
  sheetText: { ...Type.body, color: Colors.muted },
  pair: { flexDirection: 'row', gap: Spacing.md },
});
