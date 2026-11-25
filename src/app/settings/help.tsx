import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { accountApi, errorMessage, fieldErrors, publicApi } from '@/api';
import {
  Button,
  Card,
  ChipGroup,
  contentWidth,
  EmptyState,
  ErrorState,
  FieldLabel,
  Header,
  ListFooter,
  ListSkeleton,
  Pill,
  Screen,
  SegmentedTabs,
  Sheet,
  TextField,
  Touchable,
  type Tone,
} from '@/components/ui';
import { usePaged } from '@/hooks/usePaged';
import { useQuery } from '@/hooks/useQuery';
import { formatDate, stripHtml } from '@/lib/format';
import { useSession } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { Faq, SupportTicket, TicketType } from '@/types';

type Tab = 'faqs' | 'tickets';

const TICKET_TYPES: { key: TicketType; label: string }[] = [
  { key: 'help', label: 'Help' },
  { key: 'class_change', label: 'Class/school change' },
  { key: 'data_export', label: 'Data export' },
  { key: 'appeal', label: 'Appeal' },
  { key: 'other', label: 'Other' },
];

function statusTone(status: string): Tone {
  if (status === 'open' || status === 'pending') return 'warning';
  if (status === 'answered' || status === 'replied' || status === 'resolved') return 'success';
  if (status === 'closed') return 'neutral';
  return 'info';
}

function titleCase(s: string) {
  return s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export default function HelpScreen() {
  const [tab, setTab] = useState<Tab>('faqs');
  const [composer, setComposer] = useState(false);
  const config = useSession((s) => s.config);

  const tickets = usePaged<SupportTicket>(({ page }) => accountApi.tickets(page), [], { enabled: tab === 'tickets' });

  return (
    <Screen>
      <Header title="Help & support" right={<Button label="New ticket" size="sm" variant="secondary" icon="add" onPress={() => setComposer(true)} />} />
      <SegmentedTabs
        tabs={[
          { key: 'faqs', label: 'FAQs' },
          { key: 'tickets', label: 'My tickets' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'faqs' ? (
        <Faqs supportEmail={config?.support?.email} supportPhone={config?.support?.phone} onNewTicket={() => setComposer(true)} />
      ) : tickets.loading ? (
        <ListSkeleton rows={4} avatar={false} />
      ) : tickets.error && !tickets.items.length ? (
        <ErrorState error={tickets.error} onRetry={tickets.reload} />
      ) : (
        <FlatList
          data={tickets.items}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={[styles.list, contentWidth]}
          refreshControl={<RefreshControl refreshing={tickets.refreshing} onRefresh={tickets.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          onEndReached={tickets.loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState icon="chatbox-ellipses-outline" title="No tickets yet" message="Ask us anything — our team replies here." actionLabel="New ticket" onAction={() => setComposer(true)} />
          }
          ListFooterComponent={<ListFooter loading={tickets.loadingMore} error={tickets.moreError} onRetry={tickets.loadMore} />}
          renderItem={({ item }) => <TicketCard ticket={item} />}
        />
      )}
      <NewTicketSheet
        visible={composer}
        onClose={() => setComposer(false)}
        onCreated={() => {
          setComposer(false);
          setTab('tickets');
          tickets.refresh();
        }}
      />
    </Screen>
  );
}

function Faqs({ supportEmail, supportPhone, onNewTicket }: { supportEmail?: string | null; supportPhone?: string | null; onNewTicket: () => void }) {
  const q = useQuery(() => publicApi.faqs(), []);
  const [open, setOpen] = useState<number | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const f of q.data ?? []) {
      const k = f.category?.trim() || 'General';
      map.set(k, [...(map.get(k) ?? []), f]);
    }
    return [...map.entries()];
  }, [q.data]);

  if (q.loading) return <ListSkeleton rows={6} avatar={false} />;
  if (q.error && !q.data) return <ErrorState error={q.error} onRetry={q.reload} />;

  return (
    <ScrollView
      contentContainerStyle={[styles.list, contentWidth]}
      refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
      {groups.length === 0 ? <EmptyState icon="help-circle-outline" title="No FAQs yet" message="Have a question? Send us a ticket." compact /> : null}
      {groups.map(([category, faqs]) => (
        <View key={category} style={styles.group}>
          <Text style={styles.groupTitle} accessibilityRole="header">
            {category}
          </Text>
          <View style={styles.faqCard}>
            {faqs.map((f, i) => {
              const expanded = open === f.id;
              return (
                <View key={f.id} style={i < faqs.length - 1 && styles.faqBorder}>
                  <Touchable
                    scaleTo={0.99}
                    onPress={() => setOpen(expanded ? null : f.id)}
                    accessibilityState={{ expanded }}
                    accessibilityLabel={f.question}
                    style={styles.faqHead}>
                    <Text style={styles.question}>{f.question}</Text>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.muted} />
                  </Touchable>
                  {expanded ? <Text style={styles.answer}>{stripHtml(f.answer)}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}
      <Card style={styles.contact}>
        <Text style={styles.contactTitle}>Still need help?</Text>
        <Text style={styles.contactText}>Send a ticket and we will reply in the app.</Text>
        <Button label="New ticket" onPress={onNewTicket} variant="secondary" size="sm" icon="create-outline" />
        {supportEmail ? (
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${supportEmail}`)} accessibilityRole="link">
            {supportEmail}
          </Text>
        ) : null}
        {supportPhone ? (
          <Text style={styles.link} onPress={() => Linking.openURL(`tel:${supportPhone}`)} accessibilityRole="link">
            {supportPhone}
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  return (
    <Card style={styles.ticket}>
      <View style={styles.ticketHead}>
        <Text style={styles.ticketSubject} numberOfLines={2}>
          {ticket.subject}
        </Text>
        <Pill label={titleCase(ticket.status)} tone={statusTone(ticket.status)} />
      </View>
      <Text style={styles.ticketMeta}>
        {ticket.type_label} · {formatDate(ticket.created_at)}
      </Text>
      <Text style={styles.ticketBody} numberOfLines={4}>
        {ticket.message}
      </Text>
      {ticket.reply ? (
        <View style={styles.reply}>
          <Text style={styles.replyLabel}>Reply from ActiveSchool{ticket.replied_at ? ` · ${formatDate(ticket.replied_at)}` : ''}</Text>
          <Text style={styles.replyText}>{ticket.reply}</Text>
        </View>
      ) : null}
    </Card>
  );
}

function NewTicketSheet({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<TicketType>('help');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const local: Record<string, string> = {};
    if (!subject.trim()) local.subject = 'Add a short subject.';
    if (!message.trim()) local.message = 'Tell us what you need.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await accountApi.createTicket({ type, subject: subject.trim(), message: message.trim() });
      setSubject('');
      setMessage('');
      setType('help');
      onCreated();
      Alert.alert('Ticket sent', 'We will reply here in My tickets.');
    } catch (e) {
      const f = fieldErrors(e);
      if (Object.keys(f).length) setErrors(f);
      else Alert.alert('Could not send', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="New ticket">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
        <View style={styles.field}>
          <FieldLabel>Topic</FieldLabel>
          <ChipGroup options={TICKET_TYPES} selected={[type]} onToggle={setType} />
        </View>
        <TextField label="Subject" value={subject} onChangeText={setSubject} maxLength={150} error={errors.subject} />
        <TextField label="Message" value={message} onChangeText={setMessage} multiline maxLength={3000} error={errors.message} />
        <Button label="Send ticket" onPress={submit} loading={busy} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { padding: ScreenPadding, gap: Spacing.md, paddingBottom: Spacing.xxl, flexGrow: 1 },
  group: { gap: Spacing.sm },
  groupTitle: { ...Type.caption, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: Spacing.xs },
  faqCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline, overflow: 'hidden' },
  faqBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  question: { ...Type.body, fontWeight: '500', color: Colors.ink, flex: 1 },
  answer: { ...Type.body, color: Colors.body, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  contact: { gap: Spacing.sm, marginTop: Spacing.sm },
  contactTitle: { ...Type.subheading, color: Colors.ink },
  contactText: { ...Type.small, color: Colors.muted },
  link: { ...Type.small, color: Colors.primary, fontWeight: '500', paddingVertical: Spacing.xs },
  ticket: { gap: Spacing.xs + 2 },
  ticketHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  ticketSubject: { ...Type.subheading, color: Colors.ink, flex: 1 },
  ticketMeta: { ...Type.caption, color: Colors.muted },
  ticketBody: { ...Type.body, color: Colors.body },
  reply: { backgroundColor: Colors.primaryTint, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs, marginTop: Spacing.xs },
  replyLabel: { ...Type.caption, fontWeight: '600', color: Colors.primary },
  replyText: { ...Type.body, color: Colors.ink },
  sheetBody: { gap: Spacing.md, paddingBottom: Spacing.sm },
  field: { gap: Spacing.sm },
});
