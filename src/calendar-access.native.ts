import type { CalendarChoice } from './calendar-access';
export async function calendarChoices(date: string): Promise<CalendarChoice[]> {
  const Calendar = await import('expo-calendar');
  const permission = await Calendar.requestCalendarPermissions();
  if (!permission.granted) throw new Error('Takvim izni verilmedi. Elle plan oluşturmaya devam edebilirsin.');
  const start = new Date(`${date}T00:00:00+03:00`), end = new Date(+start + 86400000);
  const events = await Calendar.listEvents(await Calendar.getCalendars(Calendar.EntityTypes.EVENT), start, end);
  return events.slice(0, 50).map(event => ({ id: event.id, title: event.title ?? 'Etkinlik', location: event.location ?? '', start: String(event.startDate), end: String(event.endDate), allDay: event.allDay }));
}
