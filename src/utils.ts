export type RepeatFrequency = 'day' | 'week' | 'month' | 'year';

export interface HabitEvent {
    id: string;
    icon: string;
    name: string;
    color: string;
    goalAmount: number;
    goalUnit: string;
    isAllDay: boolean; // NEW: indicates if habit is all-day or has specific time
    startTime?: string; // "HH:MM" - optional now
    endTime?: string;   // "HH:MM" - optional now
    repeatDays: number[]; // 0 = Sunday
    repeatEvery: number;
    repeatFrequency: RepeatFrequency;
    startDate: string; // ISO Date YYYY-MM-DD
    endDate?: string; // ISO Date YYYY-MM-DD
}

export interface Completion {
    eventId: string;
    date: string; // ISO Date YYYY-MM-DD
    amount: number;
}

const EVENTS_KEY = 'habit_tracker_events';
const COMPLETIONS_KEY = 'habit_tracker_completions';
const DELETED_EXCEPTIONS_KEY = 'habit_deleted_exceptions';

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

// --- EVENT CRUD (Modified) ---

export const getEvents = (): HabitEvent[] => {
    try {
        const item = localStorage.getItem(EVENTS_KEY);
        return item ? JSON.parse(item) : [];
    } catch { return []; }
};

export const getEventById = (id: string): HabitEvent | undefined => {
    const events = getEvents();
    return events.find(event => event.id === id);
};

/**
 * Saves a new event OR updates an existing event based on the ID.
 */
export const saveEvent = (event: HabitEvent) => {
    const events = getEvents();
    const existingIndex = events.findIndex(e => e.id === event.id);

    let newEvents: HabitEvent[];

    if (existingIndex !== -1) {
        // Update existing event
        newEvents = [
            ...events.slice(0, existingIndex),
            event,
            ...events.slice(existingIndex + 1)
        ];
    } else {
        newEvents = [...events, event];
    }

    localStorage.setItem(EVENTS_KEY, JSON.stringify(newEvents));
};

/**
 * Deletes an event and all its associated data (past, present, and future).
 */
export const deleteEventAll = (id: string) => {
    const events = getEvents();
    const newEvents = events.filter(event => event.id !== id);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(newEvents));

    let completionsMap: Record<string, number> = {};
    try {
        const item = localStorage.getItem(COMPLETIONS_KEY);
        completionsMap = item ? JSON.parse(item) : {};
        const newCompletionsMap = Object.keys(completionsMap).reduce((acc, key) => {
            if (!key.startsWith(`${id}_`)) {
                acc[key] = completionsMap[key];
            }
            return acc;
        }, {} as Record<string, number>);
        localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(newCompletionsMap));
    } catch (error) {
        console.error("Error cleaning up completions:", error);
    }

    try {
        const exceptionsItem = localStorage.getItem(DELETED_EXCEPTIONS_KEY);
        let exceptions: Record<string, string[]> = exceptionsItem ? JSON.parse(exceptionsItem) : {};
        delete exceptions[id];
        localStorage.setItem(DELETED_EXCEPTIONS_KEY, JSON.stringify(exceptions));
    } catch (error) {
        console.error("Error cleaning up exceptions:", error);
    }
};

const getDeletedExceptions = (): Record<string, string[]> => {
    try {
        const item = localStorage.getItem(DELETED_EXCEPTIONS_KEY);
        return item ? JSON.parse(item) : {};
    } catch { return {}; }
};

const saveDeletedExceptions = (exceptions: Record<string, string[]>) => {
    localStorage.setItem(DELETED_EXCEPTIONS_KEY, JSON.stringify(exceptions));
};

/**
 * Checks if a specific date for an event has been deleted.
 */
export const isDateDeleted = (eventId: string, date: string): boolean => {
    const exceptions = getDeletedExceptions();
    return !!exceptions[eventId]?.includes(date);
};

/**
 * Deletes a single instance of a recurring event (single day exception).
 */
export const deleteEventInstance = (eventId: string, date: string) => {
    const exceptions = getDeletedExceptions();

    // Ensure the array exists for this event
    if (!exceptions[eventId]) {
        exceptions[eventId] = [];
    }

    // Add the specific date to the list of deleted instances
    if (!exceptions[eventId].includes(date)) {
        exceptions[eventId].push(date);
    }

    saveDeletedExceptions(exceptions);
};

/**
 * Deletes an event instance and all following recurring events by updating the HabitEvent's endDate.
 */
export const deleteEventFuture = (eventId: string, date: string) => {
    const events = getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex !== -1) {
        const event = events[eventIndex];
        const newEndDate = new Date(date);

        // Find the day immediately *before* the deletion date
        newEndDate.setDate(newEndDate.getDate() - 1);

        // Format the new end date to ISO
        const newEndDateISO = newEndDate.toISOString().split('T')[0];

        // The new end date must be after the start date
        if (newEndDateISO >= event.startDate.split('T')[0]) {
            // Create an updated event with the new end date
            const updatedEvent: HabitEvent = {
                ...event,
                endDate: newEndDate.toISOString(),
            };

            // Re-save the event
            saveEvent(updatedEvent);
        } else {
            // If the new end date is before the start date, it means all events are deleted.
            deleteEventAll(eventId);
        }
    }
};

export const getCompletion = (eventId: string, date: string): number => {
    try {
        const item = localStorage.getItem(COMPLETIONS_KEY);
        const map = item ? JSON.parse(item) : {};
        return map[`${eventId}_${date}`] || 0;
    } catch { return 0; }
};

export function getEventProgress(eventId: string, dateISO: string): number {
    const key = `progress_${eventId}_${dateISO}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
}

export function updateEventProgress(eventId: string, dateISO: string, progress: number): void {
    const key = `progress_${eventId}_${dateISO}`;
    localStorage.setItem(key, progress.toString());
}

export function getProgressPercent(event: HabitEvent, dateISO: string): number {
    const progress = getEventProgress(event.id, dateISO);
    return Math.min(100, (progress / event.goalAmount) * 100);
}