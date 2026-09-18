export type CalendarChoice = { id: string; title: string; location: string; start: string; end: string; allDay: boolean };
export async function calendarChoices(_date: string): Promise<CalendarChoice[]> { throw new Error('Telefon takvimi iPhone uygulamasında kullanılabilir. Burada elle plan oluşturabilirsin.'); }
