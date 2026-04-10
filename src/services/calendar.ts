// ─── Google Calendar — Agenda da Comunidade do Redentor ────────────────────
// Para gerar a API Key:
//  1. console.cloud.google.com → APIs e Serviços → Ativar "Google Calendar API"
//  2. Credenciais → Criar credencial → Chave de API
//  3. Cole a chave abaixo

const CALENDAR_ID = 'ugfvdrt2k1g99s4ltlujafm140@group.calendar.google.com';
const API_KEY = 'COLE_SUA_API_KEY_AQUI';

const BASE = 'https://www.googleapis.com/calendar/v3/calendars';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  description?: string;
}

export async function getUpcomingEvents(maxResults = 30): Promise<CalendarEvent[]> {
  const calId = encodeURIComponent(CALENDAR_ID);
  const timeMin = new Date().toISOString();
  const params = new URLSearchParams({
    key: API_KEY,
    timeMin,
    orderBy: 'startTime',
    singleEvents: 'true',
    maxResults: maxResults.toString(),
  });

  const res = await fetch(`${BASE}/${calId}/events?${params}`);
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

  const json = await res.json();
  return (json.items ?? []).map((item: any): CalendarEvent => {
    const allDay = !!item.start?.date;
    const startDate = allDay
      ? new Date(`${item.start.date}T00:00:00`)
      : new Date(item.start.dateTime);
    const endDate = allDay
      ? new Date(`${item.end.date}T00:00:00`)
      : new Date(item.end.dateTime);

    return {
      id: item.id,
      title: item.summary ?? 'Sem título',
      startDate,
      endDate,
      allDay,
      location: item.location,
      description: item.description,
    };
  });
}
