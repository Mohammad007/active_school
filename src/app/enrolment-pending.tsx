import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { errorMessage } from '@/api';
import { Avatar, Button, Card, Header, InfoRow, Logo, Screen, contentWidth } from '@/components/ui';
import { go, goReplace } from '@/lib/nav';
import { useOnboarding } from '@/stores/onboarding';
import { useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Shown instead of the feed while enrolment / consent is pending, rejected, or the school is not live. */
export default function EnrolmentPending() {
  const me = useSession((s) => s.me);
  const gate = useSession((s) => s.gate);
  const gateMessage = useSession((s) => s.gateMessage);
  const [refreshing, setRefreshing] = useState(false);
  const student = me?.student;
  const rejected = student?.enrollment_status === 'rejected';

  const content: { icon: IconName; tone: string; tint: string; title: string; message: string } = rejected
    ? {
        icon: 'close-circle-outline',
        tone: Colors.danger,
        tint: Colors.dangerTint,
        title: 'We could not verify your enrolment',
        message: gateMessage ?? 'Your school could not match these details to its records. Check your details or contact support.',
      }
    : gate === 'consent_pending'
      ? {
          icon: 'people-outline',
          tone: Colors.warning,
          tint: Colors.warningTint,
          title: 'Waiting for guardian consent',
          message: gateMessage ?? 'Your parent or guardian needs to give consent before you can use the class feed.',
        }
      : gate === 'school_disabled'
        ? {
            icon: 'school-outline',
            tone: Colors.primary,
            tint: Colors.primaryTint,
            title: 'Your school is not live yet',
            message: gateMessage ?? 'ActiveSchool has not been switched on for your school yet. We will let you know when it is.',
          }
        : {
            icon: 'hourglass-outline',
            tone: Colors.warning,
            tint: Colors.warningTint,
            title: 'Your enrolment is being verified',
            message: gateMessage ?? 'Your school is checking your details. You can use the app as soon as it is approved — pull down to check again.',
          };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await useSession.getState().refreshMe();
      const s = useSession.getState();
      if (s.gate === 'onboarding_required') goReplace('/select-school');
      else if (!s.gate) goReplace('/(tabs)/home');
    } catch (e) {
      Alert.alert('Could not check', errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  };

  const editDetails = () => {
    if (!student) return;
    useOnboarding.getState().prefill(student);
    go('/student-details');
  };

  const signOut = () =>
    Alert.alert('Sign out?', undefined, [
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

  const canEdit = !!student && (gate === 'enrollment_pending' || rejected);

  return (
    <Screen>
      <Header back={false} border={false}>
        <Logo height={22} />
      </Header>
      <ScrollView
        contentContainerStyle={[styles.body, contentWidth]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
        <Animated.View entering={FadeIn.duration(250)} style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: content.tint }]}>
            <Ionicons name={content.icon} size={30} color={content.tone} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {content.title}
          </Text>
          <Text style={styles.message}>{content.message}</Text>
        </Animated.View>

        {student ? (
          <Card style={styles.card}>
            <View style={styles.who}>
              <Avatar uri={student.avatar_url} name={student.display_name} size={44} />
              <View style={styles.flex}>
                <Text style={styles.name}>{student.display_name}</Text>
                <Text style={styles.meta}>{student.name}</Text>
              </View>
            </View>
            <InfoRow label="School" value={student.school?.name} icon="school-outline" />
            <InfoRow label="Class" value={student.class_label} icon="people-outline" />
            <InfoRow label="Student ID" value={student.student_identifier} icon="card-outline" last />
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button label="Check again" icon="refresh" onPress={refresh} loading={refreshing} />
          {canEdit ? <Button label="Edit my details" variant="secondary" icon="create-outline" onPress={editDetails} /> : null}
          <Button label="Help & support" variant="outline" icon="help-circle-outline" onPress={() => go('/settings/help')} />
          <Button label="Sign out" variant="ghost" onPress={signOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { flexGrow: 1, padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xl },
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  title: { ...Type.title, color: Colors.ink, textAlign: 'center' },
  message: { ...Type.body, color: Colors.muted, textAlign: 'center', maxWidth: 420 },
  card: { gap: Spacing.xs },
  who: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  name: { ...Type.subheading, color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted },
  actions: { gap: Spacing.sm },
});
