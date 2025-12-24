import { differenceInCalendarMonths, differenceInCalendarWeeks, differenceInCalendarYears, getDay, isSameDay, isWithinInterval, parseISO } from "date-fns";

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

export interface TaskWithCompletion {
    event: HabitEvent;
    isCompleted: boolean;
    progress: number;
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

// Add to existing types
export interface EventException {
    eventId: string;
    date: string; // ISO Date YYYY-MM-DD
    modifiedFields: Partial<HabitEvent>;
}

const EXCEPTIONS_KEY = 'habit_event_exceptions';

// Exception management functions
export const getExceptions = (): EventException[] => {
    try {
        const item = localStorage.getItem(EXCEPTIONS_KEY);
        return item ? JSON.parse(item) : [];
    } catch { return []; }
};

export const saveException = (exception: EventException) => {
    const exceptions = getExceptions();
    const existingIndex = exceptions.findIndex(
        e => e.eventId === exception.eventId && e.date === exception.date
    );

    let newExceptions: EventException[];
    if (existingIndex !== -1) {
        newExceptions = [
            ...exceptions.slice(0, existingIndex),
            exception,
            ...exceptions.slice(existingIndex + 1)
        ];
    } else {
        newExceptions = [...exceptions, exception];
    }

    localStorage.setItem(EXCEPTIONS_KEY, JSON.stringify(newExceptions));
};

export const getExceptionForDate = (eventId: string, date: string): EventException | undefined => {
    const exceptions = getExceptions();
    return exceptions.find(e => e.eventId === eventId && e.date === date);
};

export const deleteExceptionsForEvent = (eventId: string) => {
    const exceptions = getExceptions();
    const filtered = exceptions.filter(e => e.eventId !== eventId);
    localStorage.setItem(EXCEPTIONS_KEY, JSON.stringify(filtered));
};

export const deleteExceptionForDate = (eventId: string, date: string) => {
    const exceptions = getExceptions();
    const filtered = exceptions.filter(e => !(e.eventId === eventId && e.date === date));
    localStorage.setItem(EXCEPTIONS_KEY, JSON.stringify(filtered));
};

// Update deleteEventAll to also clear exceptions
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

    // Clear event exceptions
    deleteExceptionsForEvent(id);
};

// Helper to create a new event for "this and following"
export const createFollowingEvent = (originalEvent: HabitEvent, fromDate: string, updates: Partial<HabitEvent>): string => {
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    
    const newEvent: HabitEvent = {
        ...originalEvent,
        ...updates,
        id: newId,
        startDate: fromDate,
    };

    saveEvent(newEvent);
    
    // Update original event to end before this date
    const originalEndDate = new Date(fromDate);
    originalEndDate.setDate(originalEndDate.getDate() - 1);
    
    const updatedOriginal: HabitEvent = {
        ...originalEvent,
        endDate: originalEndDate.toISOString().split('T')[0],
    };
    
    saveEvent(updatedOriginal);
    
    return newId;
};

export const doesEventOccurOnDate = (event: HabitEvent, date: Date) => {
    const start = parseISO(event.startDate);
    const end = event.endDate ? parseISO(event.endDate) : new Date(2100, 0, 1);

    if (!isWithinInterval(date, { start, end })) return false;

    if (event.repeatFrequency === 'week') {
        const dayOfWeek = getDay(date);
        if (!event.repeatDays.includes(dayOfWeek)) return false;

        const weeksDiff = differenceInCalendarWeeks(date, start, { weekStartsOn: 0 });
        if (weeksDiff % event.repeatEvery !== 0) return false;

    } else if (event.repeatFrequency === 'month') {
        const monthsDiff = differenceInCalendarMonths(date, start);
        if (monthsDiff % event.repeatEvery !== 0) return false;

        if (date.getDate() !== start.getDate()) return false;

    } else if (event.repeatFrequency === 'year') {
        const yearsDiff = differenceInCalendarYears(date, start);
        if (yearsDiff % event.repeatEvery !== 0) return false;

        if (date.getMonth() !== start.getMonth() || date.getDate() !== start.getDate()) return false;
    }

    if (event.repeatFrequency === 'day' && event.repeatEvery === 1 && event.repeatDays.length === 0) {
        return isSameDay(date, start);
    }

    return true;
};

export const isDailyCompletionMet = (date: Date): boolean => {
    const allEvents = getEvents(); // Assuming this retrieves your global list
    
    const dateISO = date.toISOString().split('T')[0];
    const daysEvents = allEvents.filter(event => 
        !isDateDeleted(event.id, dateISO) && doesEventOccurOnDate(event, date)
    );

    // If no habits are scheduled, it's not a "streak" day (change this logic if you prefer free days to count)
    if (daysEvents.length === 0) return false;

    // 2. Check if every single event is completed
    const allCompleted = daysEvents.every(event => {
        const progress = getEventProgress(event.id, dateISO);
        return progress >= event.goalAmount;
    });

    return allCompleted;
};

export const lightenColor = (color: string, amount: number = 0.3): string => {
    let hex = color.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

    const toHex = (val: number) => val.toString(16).padStart(2, '0');

    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

export const darkenColor = (color: string, amount: number = 0.3): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.floor(r * (1 - amount));
    const newG = Math.floor(g * (1 - amount));
    const newB = Math.floor(b * (1 - amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};