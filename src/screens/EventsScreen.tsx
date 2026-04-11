import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../theme';
import { Card } from '../components';
import { getUpcomingEvents, CalendarEvent } from '../services/calendar';

// ─── Helpers de data ─────────────────────────────────────────────────────────

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatTime(date: Date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}h${m === '00' ? '' : m}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

function formatDateRange(event: CalendarEvent): string {
  if (event.allDay) {
    const d = event.startDate;
    const end = new Date(event.endDate);
    end.setDate(end.getDate() - 1); // Google retorna end exclusivo para all-day
    if (isSameDay(d, end)) return 'Dia todo';
    return `${d.getDate()} a ${end.getDate()} de ${MONTHS_FULL[end.getMonth()]}`;
  }
  const start = formatTime(event.startDate);
  const end = formatTime(event.endDate);
  return `${start} – ${end}`;
}

/** Agrupa eventos por mês */
function groupByMonth(events: CalendarEvent[]) {
  const groups: Map<string, CalendarEvent[]> = new Map();
  for (const ev of events) {
    const key = `${ev.startDate.getFullYear()}-${ev.startDate.getMonth()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev);
  }
  return groups;
}

// ─── Componente do evento ─────────────────────────────────────────────────────

function EventCard({ event }: { event: CalendarEvent }) {
  const [expanded, setExpanded] = useState(false);
  const d = event.startDate;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded((v) => !v)}>
      <Card style={styles.eventCard}>
        {/* Coluna da data */}
        <View style={styles.datePill}>
          <Text style={styles.dateDay}>{DAYS[d.getDay()]}</Text>
          <Text style={styles.dateNum}>{d.getDate()}</Text>
          <Text style={styles.dateMon}>{MONTHS[d.getMonth()]}</Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.eventBody}>
          <Text style={styles.eventTitle} numberOfLines={expanded ? undefined : 2}>
            {event.title}
          </Text>
          <Text style={styles.eventTime}>{formatDateRange(event)}</Text>
          {event.location ? (
            <Text style={styles.eventLocation} numberOfLines={1}>📍 {event.location}</Text>
          ) : null}
          {expanded && event.description ? (
            <Text style={styles.eventDesc}>{event.description.replace(/<[^>]+>/g, '').trim()}</Text>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ─── Tela principal ────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await getUpcomingEvents(40);
      setEvents(data);
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>📅</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>📅</Text>
        <Text style={styles.errorText}>Nenhum evento próximo encontrado.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Atualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const groups = groupByMonth(events);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={Colors.primary}
        />
      }
    >
      {Array.from(groups.entries()).map(([key, monthEvents]) => {
        const [year, month] = key.split('-').map(Number);
        return (
          <View key={key}>
            <Text style={styles.monthHeader}>
              {MONTHS_FULL[month].toUpperCase()} {year !== new Date().getFullYear() ? year : ''}
            </Text>
            {monthEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, backgroundColor: Colors.background },
  monthHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 2,
  },
  eventCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    padding: 12,
  },
  datePill: {
    width: 44,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  dateDay: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateNum: { fontSize: 22, fontWeight: '700', color: Colors.primary, fontFamily: 'Inter_700Bold', lineHeight: 26 },
  dateMon: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  eventBody: { flex: 1, gap: 3 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  eventTime: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  eventLocation: { fontSize: 11, color: Colors.textMuted },
  eventDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, lineHeight: 18 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
