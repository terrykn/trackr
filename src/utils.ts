export type RepeatFrequency = 'week' | 'month' | 'year';

export interface HabitEvent {
  id: string;
  icon: string;
  name: string;
  color: string;
  goalAmount: number;
  goalUnit: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  repeatDays: number[]; // 0 = Sunday
  repeatEvery: number;
  repeatFrequency: RepeatFrequency;
  startDate: string; // ISO
  endDate?: string;
}

export interface Completion {
    eventId: string;
    date: string; // ISO Date YYYY-MM-DD
    amount: number;
}

const EVENTS_KEY = 'habit_tracker_events';
const COMPLETIONS_KEY = 'habit_tracker_completions';

export const PALE_COLORS = [
    '#FFD1DC', // Pastel Pink
    '#FFDFD3', // Pastel Orange
    '#FFFFD1', // Pastel Yellow
    '#D7FFD9', // Pastel Green
    '#D1EAFF', // Pastel Blue
    '#E0D1FF', // Pastel Purple
    '#F5F5F5', // Pastel Gray
    '#FFD6C9', // Peach
];

export const getEvents = (): HabitEvent[] => {
  try {
    const item = localStorage.getItem(EVENTS_KEY);
    return item ? JSON.parse(item) : [];
  } catch { return []; }
};

export const saveEvent = (event: HabitEvent) => {
  const events = getEvents();
  localStorage.setItem(EVENTS_KEY, JSON.stringify([...events, event]));
};

export const getCompletion = (eventId: string, date: string): number => {
    try {
        const item = localStorage.getItem(COMPLETIONS_KEY);
        const map = item ? JSON.parse(item) : {};
        return map[`${eventId}_${date}`] || 0;
    } catch { return 0; }
};

export const getProgressPercent = (event: HabitEvent, date: string): number => {
    const current = getCompletion(event.id, date);
    if (!event.goalAmount) return 0;
    return Math.min(100, Math.max(0, (current / event.goalAmount) * 100));
};