import React, { useMemo, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sunrise, Sun, Moon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useNavigate } from 'react-router';
import {
    format, addDays, subDays, startOfWeek, isSameDay,
    parseISO, isWithinInterval, getDay, differenceInCalendarWeeks,
    differenceInCalendarMonths, differenceInCalendarYears
} from 'date-fns';
import { getEvents, getProgressPercent, isDateDeleted, updateEventProgress, getEventProgress } from '../utils';
import type { HabitEvent } from '../utils';

const EventIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
    const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;
    return Icon ? <Icon size={size} strokeWidth={2} /> : null;
};

const doesEventOccurOnDate = (event: HabitEvent, date: Date) => {
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

const calculateEventGeometry = (event: HabitEvent, currentHour: number) => {
    const [startH, startM] = event.startTime.split(':').map(Number);
    const [endH, endM] = event.endTime.split(':').map(Number);

    const totalStartMinutes = startH * 60 + startM;
    const totalEndMinutes = endH * 60 + endM;

    const slotStartMinutes = currentHour * 60;
    const slotEndMinutes = (currentHour + 1) * 60;

    const segmentStart = Math.max(totalStartMinutes, slotStartMinutes);
    const segmentEnd = Math.min(totalEndMinutes, slotEndMinutes);

    const durationMinutes = Math.max(0, segmentEnd - segmentStart);

    let topOffsetMinutes = 0;
    const eventStartsInThisSlot = totalStartMinutes >= slotStartMinutes && totalStartMinutes < slotEndMinutes;

    if (eventStartsInThisSlot) {
        topOffsetMinutes = startM;
    } else if (totalStartMinutes < slotStartMinutes) {
        topOffsetMinutes = 0;
    }

    const top = `${(topOffsetMinutes / 60) * 60}px`;
    const height = `${(durationMinutes / 60) * 60}px`;

    return { top, height };
};

// Helper to darken color
const darkenColor = (color: string, amount: number = 0.3): string => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Darken
    const newR = Math.floor(r * (1 - amount));
    const newG = Math.floor(g * (1 - amount));
    const newB = Math.floor(b * (1 - amount));

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export function DayViewHeader({ currentDate, onDateChange }: { currentDate: Date, onDateChange: (d: Date) => void }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return (
        <div className="bg-white pb-2 pt-2 px-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => onDateChange(subDays(currentDate, 7))} className="p-1.5 text-gray-400 hover:text-black active:scale-95 transition-transform">
                    <ChevronLeft size={20} />
                </button>
                <span className="text-lg font-semibold tracking-wide text-gray-800">
                    {format(currentDate, 'MMMM yyyy')}
                </span>
                <button onClick={() => onDateChange(addDays(currentDate, 7))} className="p-1.5 text-gray-400 hover:text-black active:scale-95 transition-transform">
                    <ChevronRight size={20} />
                </button>
            </div>
            <div className="flex justify-between items-center gap-1">
                {weekDays.map((date) => {
                    const isSelected = isSameDay(date, currentDate);
                    const isToday = isSameDay(date, new Date());
                    return (
                        <button
                            key={date.toString()}
                            onClick={() => onDateChange(date)}
                            className={`flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all active:scale-95 border
                                ${isSelected
                                    ? 'bg-black text-white border-black'
                                    : isToday
                                        ? 'bg-gray-100 text-gray-800 border-gray-200'
                                        : 'bg-transparent text-gray-600 hover:bg-gray-50 border-transparent'
                                }`}
                        >
                            <span className={`text-[9px] font-semibold uppercase mb-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                {format(date, 'EEE')}
                            </span>
                            <span className="text-lg font-bold">{format(date, 'd')}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function DayEventBlock({ event, date, onEventClick }: { event: HabitEvent, date: Date, onEventClick: (eventId: string) => void }) {
    const dateISO = format(date, 'yyyy-MM-dd');
    const [currentProgress, setCurrentProgress] = useState(() => getEventProgress(event.id, dateISO));
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const progressPercent = (currentProgress / event.goalAmount) * 100;
    const daysMap = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const updateProgressFromPosition = (clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newProgress = Math.round(percentage * event.goalAmount);

        setCurrentProgress(newProgress);
        updateEventProgress(event.id, dateISO, newProgress);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        updateProgressFromPosition(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        updateProgressFromPosition(e.clientX);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        updateProgressFromPosition(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        updateProgressFromPosition(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isDragging) return;

        const target = e.target as HTMLElement;
        if (target.closest('.progress-area')) return;

        onEventClick(event.id);
    };

    const darkerColor = darkenColor(event.color, 0.25);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-3xl mb-3 bg-white cursor-pointer transition-all border border-gray-200
                ${isDragging ? 'scale-[1.02]' : 'active:scale-[0.98]'}
            `}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Progress fill */}
            <div
                className="absolute top-0 left-0 bottom-0 transition-all ease-out z-0"
                style={{
                    width: `${Math.min(100, progressPercent)}%`,
                    backgroundColor: event.color,
                    opacity: 0.3,
                    transitionDuration: isDragging ? '50ms' : '300ms'
                }}
            />

            <div className="relative z-10 p-4">
                {/* Header row */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white border border-black/5 flex-shrink-0"
                            style={{ backgroundColor: darkerColor }}
                        >
                            <EventIcon name={event.icon} size={20} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex flex-row items-center justify-between w-full gap-3">
                                <span className="text-gray-900 text-base font-semibold mb-0.5 truncate">{event.name}</span>
                                {event.repeatFrequency === 'week' && (
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        {daysMap.map((day, index) => (
                                            <span
                                                key={index}
                                                className={`text-xs font-bold ${event.repeatDays.includes(index) ? 'text-gray-800' : 'text-gray-300'}`}
                                            >
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-row items-center justify-between w-full gap-3">
                                <span className="text-xs text-gray-400 flex-shrink-0">{event.startTime} - {event.endTime}</span>
                                {event.repeatFrequency === 'week' && (
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">
                                        Every {event.repeatEvery} {event.repeatFrequency}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Goal section */}
                <div className="progress-area flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Goal: <span className="font-semibold text-gray-800">{currentProgress}/{event.goalAmount} {event.goalUnit}</span>
                    </span>
                    <div className="flex items-center gap-1">
                        <div
                            className="w-2 h-2 rounded-full border border-gray-200"
                            style={{ backgroundColor: currentProgress >= event.goalAmount ? '#22c55e' : event.color }}
                        />
                        <span className="text-[10px] font-medium" style={{ color: currentProgress >= event.goalAmount ? '#22c55e' : '#9ca3af' }}>
                            {currentProgress >= event.goalAmount ? 'Completed' : `${Math.round(progressPercent)}%`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DayView({ currentDate }: { currentDate: Date }) {
    const navigate = useNavigate();

    const handleEventClick = (eventId: string) => {
        const dateISO = format(currentDate, 'yyyy-MM-dd');
        navigate(`/edit/${eventId}?date=${dateISO}`);
    };

    const events = useMemo(() => {
        const dateISO = format(currentDate, 'yyyy-MM-dd');

        const all = getEvents();
        return all
            .filter(e => doesEventOccurOnDate(e, currentDate))
            .filter(e => !isDateDeleted(e.id, dateISO))
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

    const Section = ({ title, icon, items }: { title: string, icon: React.ReactNode, items: HabitEvent[] }) => (
        items.length > 0 ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pl-1">
                    <span className="text-gray-400">{icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</span>
                </div>
                {items.map(e => (
                    <DayEventBlock
                        key={e.id}
                        event={e}
                        date={currentDate}
                        onEventClick={handleEventClick}
                    />
                ))}
            </div>
        ) : null
    );

    return (
        <div className="px-4 py-4 h-full overflow-y-auto pb-24 bg-gray-50/50">
            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                        <Sun size={24} className="text-gray-300" />
                    </div>
                    <span className="text-gray-400 text-sm">No habits scheduled for today</span>
                </div>
            ) : (
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
            <button onClick={() => onDateChange(subDays(currentDate, 7))} className="p-2 text-gray-400 hover:text-black active:scale-95 transition-transform">
                <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-semibold text-gray-800">
                {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
            </span>
            <button onClick={() => onDateChange(addDays(currentDate, 7))} className="p-2 text-gray-400 hover:text-black active:scale-95 transition-transform">
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

export function WeekEventBlock({ event, date, onEventClick, style }: {
    event: HabitEvent,
    date: Date,
    onEventClick: (eventId: string, date: Date) => void,
    style: React.CSSProperties,
}) {
    const dateISO = format(date, 'yyyy-MM-dd');
    const progress = getProgressPercent(event, dateISO);

    // Calculate if compact based on width
    const isCompact = style.width && parseFloat(style.width as string) < 50;

    return (
        <div
            className="absolute overflow-hidden cursor-pointer active:scale-[0.98] transition-transform rounded-md border border-gray-200"
            title={`${event.name} (${event.startTime} - ${event.endTime})`}
            onClick={(e) => {
                e.stopPropagation();
                onEventClick(event.id, date);
            }}
            style={{ 
                ...style, 
                backgroundColor: event.color, 
                opacity: 0.9, 
                borderColor: `${event.color}40` 
            }}
        >
            {/* Icon */}
            <div className={`absolute ${isCompact ? 'top-1 left-1/2 -translate-x-1/2' : 'top-0.5 right-0.5'} z-10`}>
                <EventIcon name={event.icon} size={isCompact ? 12 : 10} />
            </div>
            
            {/* Event name */}
            {!isCompact && (
                <div className="pt-3 px-1 pb-1 relative z-10">
                    <span className="text-[10px] font-semibold leading-tight break-words line-clamp-3">
                        {event.name}
                    </span>
                </div>
            )}
            
            {/* Progress fill from bottom */}
            <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
                style={{ 
                    height: `${progress}%`, 
                    backgroundColor: '#000000', 
                    opacity: 0.2 
                }}
            />
        </div>
    );
}

export function WeekView({ currentDate }: { currentDate: Date }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const hours = Array.from({ length: 18 }, (_, i) => i + 6);

    const events = useMemo(() => getEvents(), []);
    const navigate = useNavigate();

    const handleEventClick = (eventId: string, clickedDate: Date) => {
        const dateISO = format(clickedDate, 'yyyy-MM-dd');
        navigate(`/edit/${eventId}?date=${dateISO}`);
    };

    const getEventsForDay = (day: Date) => {
        const dayISO = format(day, 'yyyy-MM-dd');

        return events.filter(e => {
            if (!doesEventOccurOnDate(e, day)) return false;
            if (isDateDeleted(e.id, dayISO)) return false;
            return true;
        });
    };

    const calculateEventPositions = (dayEvents: HabitEvent[]) => {
        const positions: Map<string, { column: number, totalColumns: number }> = new Map();

        const sortedEvents = [...dayEvents].sort((a, b) => {
            const aStart = a.startTime.split(':').map(Number);
            const bStart = b.startTime.split(':').map(Number);
            return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
        });

        const columns: { endTime: number, eventId: string }[] = [];

        sortedEvents.forEach(event => {
            const [startH, startM] = event.startTime.split(':').map(Number);
            const [endH, endM] = event.endTime.split(':').map(Number);
            const eventStart = startH * 60 + startM;
            const eventEnd = endH * 60 + endM;

            let columnIndex = columns.findIndex(col => col.endTime <= eventStart);

            if (columnIndex === -1) {
                columnIndex = columns.length;
                columns.push({ endTime: eventEnd, eventId: event.id });
            } else {
                columns[columnIndex] = { endTime: eventEnd, eventId: event.id };
            }

            positions.set(event.id, { column: columnIndex, totalColumns: 0 });
        });

        sortedEvents.forEach(event => {
            const [startH, startM] = event.startTime.split(':').map(Number);
            const [endH, endM] = event.endTime.split(':').map(Number);
            const eventStart = startH * 60 + startM;
            const eventEnd = endH * 60 + endM;

            const overlappingEvents = sortedEvents.filter(other => {
                const [otherStartH, otherStartM] = other.startTime.split(':').map(Number);
                const [otherEndH, otherEndM] = other.endTime.split(':').map(Number);
                const otherStart = otherStartH * 60 + otherStartM;
                const otherEnd = otherEndH * 60 + otherEndM;

                return eventStart < otherEnd && eventEnd > otherStart;
            });

            const maxColumn = Math.max(...overlappingEvents.map(e => positions.get(e.id)!.column));
            overlappingEvents.forEach(e => {
                const pos = positions.get(e.id)!;
                pos.totalColumns = Math.max(pos.totalColumns, maxColumn + 1);
            });
        });

        return positions;
    };

    // Calculate full event geometry (not per-slot)
    const calculateFullEventGeometry = (event: HabitEvent, firstHour: number) => {
        const [startH, startM] = event.startTime.split(':').map(Number);
        const [endH, endM] = event.endTime.split(':').map(Number);

        const totalStartMinutes = startH * 60 + startM;
        const totalEndMinutes = endH * 60 + endM;
        const durationMinutes = totalEndMinutes - totalStartMinutes;

        // Calculate top offset from the first hour row
        const firstHourStart = firstHour * 60;
        const topOffsetMinutes = totalStartMinutes - firstHourStart;

        const top = `${(topOffsetMinutes / 60) * 60}px`;
        const height = `${(durationMinutes / 60) * 60}px`;

        return { top, height };
    };

    // Get the hour when the event starts (for positioning in the grid)
    const getEventStartHour = (event: HabitEvent) => {
        return parseInt(event.startTime.split(':')[0], 10);
    };

    return (
        <div className="h-full overflow-y-auto bg-white pb-24">
            {/* Header */}
            <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] sticky top-0 z-40 bg-white border-b border-gray-100">
                <div className="flex-shrink-0" />
                {days.map(d => (
                    <div key={d.toString()} className="text-center py-2 border-l border-gray-50 min-w-0">
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{format(d, 'EEEEE')}</div>
                        <div className={`text-sm font-bold ${isSameDay(d, new Date()) ? 'text-blue-500' : 'text-gray-800'}`}>{format(d, 'd')}</div>
                    </div>
                ))}
            </div>

            {/* Time grid with events overlay */}
            <div className="relative">
                {/* Hour rows */}
                {hours.map(hour => (
                    <div key={hour} className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] h-[60px] border-b border-gray-50">
                        <div className="text-[10px] text-gray-400 text-right pr-2 pt-1 -mt-2 relative z-10">
                            {hour}:00
                        </div>
                        {days.map(d => (
                            <div key={d.toString()} className="border-l border-gray-50 relative min-w-0" />
                        ))}
                    </div>
                ))}

                {/* Events overlay - positioned absolutely over the grid */}
                <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                    <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] h-full">
                        <div className="flex-shrink-0" />
                        {days.map(d => {
                            const dayISO = format(d, 'yyyy-MM-dd');
                            const dayEvents = getEventsForDay(d);
                            const positions = calculateEventPositions(dayEvents);

                            return (
                                <div key={d.toString()} className="relative min-w-0 pointer-events-auto">
                                    {dayEvents.map(event => {
                                        const startHour = getEventStartHour(event);
                                        
                                        // Only render if event starts within our visible hours
                                        if (startHour < hours[0] || startHour > hours[hours.length - 1]) {
                                            return null;
                                        }

                                        const geometry = calculateFullEventGeometry(event, hours[0]);
                                        const pos = positions.get(event.id)!;
                                        const width = `calc(${100 / pos.totalColumns}% - 2px)`;
                                        const left = `calc(${(pos.column / pos.totalColumns) * 100}% + 1px)`;

                                        return (
                                            <WeekEventBlock
                                                key={event.id}
                                                event={event}
                                                date={d}
                                                onEventClick={handleEventClick}
                                                style={{
                                                    top: geometry.top,
                                                    height: geometry.height,
                                                    width,
                                                    left,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}