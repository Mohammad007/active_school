import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { errorMessage, fieldErrors, goalsApi } from '@/api';
import { AuthBadge } from '@/components/auth/AuthArt';
import { GOAL_COLOURS, GOAL_ICONS } from '@/components/modules/GoalCard';
import {
  Button,
  Card,
  ChipBar,
  ErrorState,
  FeatureOff,
  FieldError,
  FieldLabel,
  FormScroll,
  Header,
  IconButton,
  ListSkeleton,
  Screen,
  SwitchRow,
  TextField,
  Toggle,
  Touchable,
} from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { maskDateInput, parseUserDate, toUserDate, today } from '@/lib/format';
import { goBack, goReplace } from '@/lib/nav';
import { useFeature, useSession } from '@/stores/session';
import { Colors, Radius, Spacing, Type } from '@/theme';
import type { GoalInput } from '@/types';

/** Create (POST /goals) or edit (?id= → PATCH /goals/{id}) a personal goal. */
export default function GoalFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const enabled = useFeature('goals');
  const categories = useSession((s) => s.categories);
  const existing = useQuery(() => goalsApi.get(id as string), [id], { enabled: enabled && editing });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState(2);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [categoryId, setCategoryId] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [reminder, setReminder] = useState(false);
  const [colour, setColour] = useState<string>(GOAL_COLOURS[0]);
  const [icon, setIcon] = useState<string>(GOAL_ICONS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const g = existing.data;
  useEffect(() => {
    if (!g) return;
    setTitle(g.title);
    setDescription(g.description ?? '');
    setTarget(g.target);
    setPeriod(g.period);
    setCategoryId(g.category?.id ?? 0);
    setDeadline(toUserDate(g.deadline));
    setReminder(g.reminder);
    if (g.colour) setColour(g.colour);
    if (g.icon) setIcon(g.icon);
  }, [g]);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Give your goal a name.';
    let deadlineIso: string | null = null;
    if (deadline.trim()) {
      deadlineIso = parseUserDate(deadline);
      if (!deadlineIso) next.deadline = 'Use DD/MM/YYYY.';
      else if (deadlineIso < today()) next.deadline = 'Pick today or a later date.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const body: GoalInput = {
      title: title.trim(),
      description: description.trim() || null,
      target,
      period,
      category_id: categoryId || null,
      deadline: deadlineIso,
      reminder,
      colour,
      icon,
    };
    setBusy(true);
    try {
      if (editing && g) {
        await goalsApi.update(g.id, body);
        goBack('/goals');
      } else {
        const created = await goalsApi.create(body);
        goReplace(`/goals/${created.id}`);
      }
    } catch (e) {
      const f = fieldErrors(e);
      if (Object.keys(f).length) setErrors(f);
      else Alert.alert('Could not save goal', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const header = <Header title={editing ? 'Edit goal' : 'New goal'} />;

  if (!enabled) {
    return (
      <Screen>
        {header}
        <FeatureOff name="Goals" />
      </Screen>
    );
  }
  if (editing && existing.loading) {
    return (
      <Screen>
        {header}
        <ListSkeleton rows={5} avatar={false} />
      </Screen>
    );
  }
  if (editing && !g) {
    return (
      <Screen>
        {header}
        <ErrorState error={existing.error} onRetry={existing.reload} feature="Goals" />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <FormScroll footer={<Button label={editing ? 'Save changes' : 'Create goal'} onPress={submit} loading={busy} />}>
        <AuthBadge icon="locate" secondary="flag" />
        <TextField
          label="Goal"
          placeholder="e.g. Two sports activities"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          maxLength={100}
        />
        <TextField
          label="Why it matters"
          optional
          placeholder="A short note for yourself"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          maxLength={255}
          multiline
        />

        <View style={styles.field}>
          <FieldLabel>Period</FieldLabel>
          <Toggle
            options={[
              { key: 'weekly', label: 'Weekly' },
              { key: 'monthly', label: 'Monthly' },
            ]}
            value={period}
            onChange={setPeriod}
          />
          <FieldError>{errors.period}</FieldError>
        </View>

        <View style={styles.field}>
          <FieldLabel>Target</FieldLabel>
          <Card style={styles.stepper}>
            <IconButton icon="remove" label="Decrease target" onPress={() => setTarget((t) => Math.max(1, t - 1))} disabled={target <= 1} filled />
            <View style={styles.stepperValue} accessible accessibilityLabel={`${target} activities per ${period === 'weekly' ? 'week' : 'month'}`}>
              <Text style={styles.stepperNumber}>{target}</Text>
              <Text style={styles.muted}>approved {target === 1 ? 'activity' : 'activities'} {period === 'weekly' ? 'a week' : 'a month'}</Text>
            </View>
            <IconButton icon="add" label="Increase target" onPress={() => setTarget((t) => Math.min(100, t + 1))} disabled={target >= 100} filled />
          </Card>
          <FieldError>{errors.target}</FieldError>
        </View>

        {categories.length ? (
          <View style={styles.field}>
            <FieldLabel optional>Category</FieldLabel>
            <ChipBar
              options={[{ key: 0, label: 'Any' }, ...categories.map((c) => ({ key: c.id, label: c.name, colour: c.colour ?? undefined }))]}
              value={categoryId}
              onChange={setCategoryId}
              style={styles.bleed}
            />
            <FieldError>{errors.category_id}</FieldError>
          </View>
        ) : null}

        <TextField
          label="Deadline"
          optional
          placeholder="DD/MM/YYYY"
          keyboardType="number-pad"
          value={deadline}
          onChangeText={(t) => setDeadline(maskDateInput(t))}
          error={errors.deadline}
          maxLength={10}
          icon="calendar-outline"
        />

        <View style={styles.field}>
          <FieldLabel>Colour</FieldLabel>
          <View style={styles.swatches}>
            {GOAL_COLOURS.map((c) => (
              <Touchable
                key={c}
                onPress={() => setColour(c)}
                scaleTo={0.9}
                accessibilityLabel={`Colour ${GOAL_COLOURS.indexOf(c) + 1}`}
                accessibilityState={{ selected: colour.toLowerCase() === c.toLowerCase() }}
                style={[styles.swatch, { backgroundColor: c }, colour.toLowerCase() === c.toLowerCase() && styles.swatchOn]}>
                {colour.toLowerCase() === c.toLowerCase() ? <Ionicons name="checkmark" size={18} color={Colors.white} /> : null}
              </Touchable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <FieldLabel>Icon</FieldLabel>
          <View style={styles.swatches}>
            {GOAL_ICONS.map((name) => {
              const on = icon === name;
              return (
                <Touchable
                  key={name}
                  onPress={() => setIcon(name)}
                  scaleTo={0.9}
                  accessibilityLabel={`Icon ${name.replace(/-/g, ' ')}`}
                  accessibilityState={{ selected: on }}
                  style={[styles.iconChoice, on && { backgroundColor: colour, borderColor: colour }]}>
                  <Ionicons name={name} size={20} color={on ? Colors.white : Colors.body} />
                </Touchable>
              );
            })}
          </View>
        </View>

        <View style={styles.switchWrap}>
          <SwitchRow title="Remind me" subtitle="A gentle nudge if the period is nearly over" value={reminder} onChange={setReminder} last />
        </View>
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  bleed: { marginHorizontal: -Spacing.lg },
  stepper: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, gap: Spacing.sm },
  stepperValue: { flex: 1, alignItems: 'center' },
  stepperNumber: { ...Type.display, color: Colors.ink },
  muted: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  swatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  swatchOn: { borderWidth: 3, borderColor: Colors.primarySoft },
  iconChoice: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchWrap: { borderRadius: Radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline },
});
