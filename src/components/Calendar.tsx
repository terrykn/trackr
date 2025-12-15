import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sunrise, Sun, Moon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
    format, addDays, subDays, startOfWeek, isSameDay,
    parseISO, isWithinInterval, getDay, differenceInCalendarWeeks,
    differenceInCalendarMonths, differenceInCalendarYears
} from 'date-fns';
import { getEvents, getProgressPercent } from '../utils';
import type { HabitEvent } from '../utils';

const EventIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
    const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;
    return Icon ? <Icon size={size} strokeWidth={2} /> : null;
};

// --- NEW LOGIC HELPER ---
/**
 * Determines if a given habit event should occur on a specific date,
 * respecting the repeat interval (Every X Weeks/Months/Years).
 */
const doesEventOccurOnDate = (event: HabitEvent, date: Date) => {
    const start = parseISO(event.startDate);
    // Set a very distant end date if not defined, for easy interval checking
    const end = event.endDate ? parseISO(event.endDate) : new Date(2100, 0, 1);

    // 1. Check if the date is within the habit's overall lifetime
    if (!isWithinInterval(date, { start, end })) return false;

    // 2. Check Frequency Interval (Every X Weeks/Months/Years)
    if (event.repeatFrequency === 'week') {
        // a. Check if the specific day of week is enabled (e.g., Monday, Tuesday)
        const dayOfWeek = getDay(date); // 0 = Sunday
        if (!event.repeatDays.includes(dayOfWeek)) return false;

        // b. Check the "Every X Weeks" interval logic
        // Calculate difference in weeks from the start date
        const weeksDiff = differenceInCalendarWeeks(date, start, { weekStartsOn: 0 });
        // The week difference must be a multiple of 'repeatEvery' (e.g., 0, 2, 4...)
        if (weeksDiff % event.repeatEvery !== 0) return false;

    } else if (event.repeatFrequency === 'month') {
        // a. Check the "Every X Months" interval logic
        const monthsDiff = differenceInCalendarMonths(date, start);
        if (monthsDiff % event.repeatEvery !== 0) return false;
        
        // b. Simple monthly logic: Must be the same day of the month as the start date
        if (date.getDate() !== start.getDate()) return false;

    } else if (event.repeatFrequency === 'year') {
        // a. Check the "Every X Years" interval logic
        const yearsDiff = differenceInCalendarYears(date, start);
        if (yearsDiff % event.repeatEvery !== 0) return false;
        
        // b. Simple yearly logic: Must be the same month and day as the start date
        if (date.getMonth() !== start.getMonth() || date.getDate() !== start.getDate()) return false;
    }

    return true;
};


export function DayViewHeader({ currentDate, onDateChange }: { currentDate: Date, onDateChange: (d: Date) => void }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return (
        <div className="bg-white pb-2 pt-2 px-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => onDateChange(subDays(currentDate, 7))} className="p-2 text-gray-400 hover:text-black">
                    <ChevronLeft size={20} />
                </button>
                <span className="text-xl font-medium tracking-wide text-gray-800">
                    {format(currentDate, 'MMMM')}
                </span>
                <button onClick={() => onDateChange(addDays(currentDate, 7))} className="p-2 text-gray-400 hover:text-black">
                    <ChevronRight size={20} />
                </button>
            </div>
            <div className="flex justify-between items-center">
                {weekDays.map((date) => {
                    const isSelected = isSameDay(date, currentDate);
                    return (
                        <div
                            key={date.toString()}
                            onClick={() => onDateChange(date)}
                            className={`flex flex-col items-center cursor-pointer p-2 rounded-xl transition-all ${isSelected ? 'bg-black text-white' : 'bg-transparent text-gray-800'}`}
                        >
                            <span className="text-xl font-bold mb-1">{format(date, 'd')}</span>
                            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white' : 'text-gray-400'}`}>{format(date, 'EEEEE')}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function DayEventBlock({ event, date }: { event: HabitEvent, date: Date }) {
    const daysMap = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const progress = getProgressPercent(event, format(date, 'yyyy-MM-dd'));

    return (
        <div className="relative overflow-hidden rounded-2xl mb-3 border border-gray-100 bg-white">
            {/* Background Fill Progress (Left to Right) */}
            <div
                className="absolute top-0 left-0 bottom-0 transition-all duration-500 ease-out z-0 opacity-50"
                style={{ width: `${progress}%`, backgroundColor: event.color }}
            />

            <div className="relative z-10 p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100 text-black">
                            <EventIcon name={event.icon} />
                        </div>
                        <span className="text-gray-800 text-md">{event.name}</span>
                    </div>
                    {/* Only show day indicators if it is a WEEKLY habit */}
                    {event.repeatFrequency === 'week' && (
                        <div className="flex gap-1">
                            {daysMap.map((day, index) => (
                                <span key={index} className={`text-xs font-bold ${event.repeatDays.includes(index) ? 'text-black' : 'text-gray-300'}`}>
                                    {day}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600 font-medium">
                        Goal: {event.goalAmount} {event.goalUnit}
                    </div>
                    <div className="text-sm text-gray-500">{event.startTime} - {event.endTime}</div>
                </div>
                <div className="flex justify-end items-center">
                    <span className="text-xs text-gray-400">
                        Every {event.repeatEvery} {event.repeatFrequency}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function DayView({ currentDate }: { currentDate: Date }) {
    const events = useMemo(() => {
        const all = getEvents();
        // UPDATED: Use the helper function to filter events
        return all.filter(e => doesEventOccurOnDate(e, currentDate))
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [currentDate]);

    const { morning, afternoon, night } = useMemo(() => {
        const morning: HabitEvent[] = [];
        const afternoon: HabitEvent[] = [];
        const night: HabitEvent[] = [];

        events.forEach(e => {
            const h = parseInt(e.startTime.split(':')[0], 10);
            if (h < 12) morning.push(e);
            else if (h < 17) afternoon.push(e);
            else night.push(e);
        });
        return { morning, afternoon, night };
    }, [events]);

    const Section = ({ title, icon, items }: { title: string, icon: any, items: HabitEvent[] }) => (
        items.length > 0 ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pl-1 opacity-40">
                    {icon} <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
                </div>
                {items.map(e => <DayEventBlock key={e.id} event={e} date={currentDate} />)}
            </div>
        ) : null
    );

    return (
        <div className="px-4 py-4 h-full overflow-y-auto pb-24">
            {events.length === 0 ? <div className="text-center text-gray-300 mt-20">No habits today</div> : (
                <>
                    <Section title="Morning" icon={<Sunrise size={14} />} items={morning} />
                    <Section title="Afternoon" icon={<Sun size={14} />} items={afternoon} />
                    <Section title="Night" icon={<Moon size={14} />} items={night} />
                </>
            )}
        </div>
    );
}

export function WeekViewHeader({ currentDate, onDateChange }: { currentDate: Date, onDateChange: (d: Date) => void }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = addDays(start, 6);

    return (
        <div className="bg-white pb-4 pt-2 px-4 border-b border-gray-100 flex items-center justify-between">
            <button onClick={() => onDateChange(subDays(currentDate, 7))} className="p-2 text-gray-400 hover:text-black">
                <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-semibold text-gray-800">
                {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
            </span>
            <button onClick={() => onDateChange(addDays(currentDate, 7))} className="p-2 text-gray-400 hover:text-black">
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

export function WeekEventBlock({ event, date }: { event: HabitEvent, date: Date }) {
    const progress = getProgressPercent(event, format(date, 'yyyy-MM-dd'));

    return (
        <div
            className="w-full h-full rounded-md border border-gray-200 flex items-center justify-center relative overflow-hidden"
            title={event.name}
        >
            {/* Background Fill (Bottom to Top) */}
            <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out z-0 opacity-60"
                style={{ height: `${progress}%`, backgroundColor: event.color }}
            />
            <div className="z-10 text-gray-800">
                <EventIcon name={event.icon} size={14} />
            </div>
        </div>
    );
}

export function WeekView({ currentDate }: { currentDate: Date }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

    const events = useMemo(() => getEvents(), []);

    const getEventsForCell = (day: Date, hour: number) => {
        return events.filter(e => {
            // UPDATED: Use the helper function to filter by recurrence logic
            if (!doesEventOccurOnDate(e, day)) return false;

            const eventHour = parseInt(e.startTime.split(':')[0], 10);
            return eventHour === hour;
        });
    };

    return (
        <div className="h-full overflow-y-auto bg-white pb-24">
            <div className="flex sticky top-0 z-20 bg-white border-b border-gray-100">
                <div className="w-12 flex-shrink-0" />
                {days.map(d => (
                    <div key={d.toString()} className="flex-1 text-center py-2 border-l border-gray-50">
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{format(d, 'EEE')}</div>
                        <div className={`text-sm font-bold ${isSameDay(d, new Date()) ? 'text-blue-500' : 'text-gray-800'}`}>{format(d, 'd')}</div>
                    </div>
                ))}
            </div>
            <div className="relative">
                {hours.map(hour => (
                    <div key={hour} className="flex min-h-[60px] border-b border-gray-50">
                        <div className="w-12 flex-shrink-0 text-[10px] text-gray-400 text-right pr-2 pt-1 -mt-2">
                            {hour}:00
                        </div>
                        {days.map(d => {
                            const cellEvents = getEventsForCell(d, hour);
                            return (
                                <div key={d.toString()} className="flex-1 border-l border-gray-50 p-0.5 flex flex-col gap-1">
                                    {cellEvents.map(e => (
                                        <div key={e.id} className="flex-1 min-h-[40px]">
                                            <WeekEventBlock event={e} date={d} />
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}