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
import { Button } from 'konsta/react';

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

// Helper to darken color
const darkenColor = (color: string, amount: number = 0.3): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.floor(r * (1 - amount));
    const newG = Math.floor(g * (1 - amount));
    const newB = Math.floor(b * (1 - amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const lightenColor = (color: string, amount: number = 0.3): string => {
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

export function DayViewHeader({ currentDate, onDateChange }: { currentDate: Date, onDateChange: (d: Date) => void }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return (
        <div className="pb-2 px-4 theme-bg-base border-b theme-border">
            <div className="flex items-center justify-between mb-2">
                <Button 
                    clear
                    onClick={() => onDateChange(subDays(currentDate, 7))} 
                    className="w-10 h-10 rounded-2xl theme-text-gray"
                >
                    <ChevronLeft size={20} />
                </Button>
                <span className="text-lg font-semibold tracking-wide theme-text-base">
                    {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button 
                    clear
                    onClick={() => onDateChange(addDays(currentDate, 7))} 
                    className="w-10 h-10 rounded-2xl theme-text-gray"
                >
                    <ChevronRight size={20} />
                </Button>
            </div>
            <div className="flex justify-between items-center gap-1">
                {weekDays.map((date) => {
                    const isSelected = isSameDay(date, currentDate);
                    const isToday = isSameDay(date, new Date());
                    return (
                        <button
                            key={date.toString()}
                            onClick={() => onDateChange(date)}
                            className={`flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all active:scale-95
                                ${isSelected
                                    ? 'theme-bg-primary theme-border theme-text-gray border'
                                    : isToday
                                        ? 'theme-bg-secondary theme-border theme-text-gray'
                                        : 'border-transparent theme-text-gray hover:theme-bg-card'
                                }`}
                        >
                            <span className="text-[9px] font-semibold uppercase mb-0.5">
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

    const isCompleted = currentProgress >= event.goalAmount;

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-2xl mb-3 cursor-pointer transition-all border theme-border theme-bg-card
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
                    opacity: 0.7,
                    transitionDuration: isDragging ? '50ms' : '300ms'
                }}
            />

            <div className="relative z-10 p-4">
                {/* Header row */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center theme-bg-card theme-text-gray border theme-border flex-shrink-0"
                        >
                            <EventIcon name={event.icon} size={20} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex flex-row items-center justify-between w-full gap-3">
                                <span className="theme-text-base text-base font-semibold mb-0.5 truncate">{event.name}</span>
                                {event.repeatFrequency === 'week' && (
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        {daysMap.map((day, index) => (
                                            <span
                                                key={index}
                                                className={`text-xs font-bold ${event.repeatDays.includes(index) ? 'theme-text-gray' : 'theme-text-muted opacity-40'}`}
                                            >
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-row items-center justify-between w-full gap-3">
                                <span className="text-xs theme-text-muted flex-shrink-0">{event.startTime} - {event.endTime}</span>
                                {event.repeatFrequency === 'week' && (
                                    <span className="text-[10px] font-semibold theme-text-muted uppercase tracking-wide flex-shrink-0">
                                        Every {event.repeatEvery} {event.repeatFrequency}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Goal section */}
                <div className="progress-area flex items-center justify-between">
                    <span className="text-sm theme-text-muted">
                        Goal: <span className="font-semibold theme-text-base">{currentProgress}/{event.goalAmount} {event.goalUnit}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <div
                            className={`w-2.5 h-2.5 rounded-full border theme-border`}
                            style={{ backgroundColor: isCompleted ? '#76f7a5ff' : event.color }}
                        />
                        <span 
                            className={`text-[10px] font-medium ${isCompleted ? 'theme-text-base' : 'theme-text-muted'}`}
                        >
                            {isCompleted ? 'Completed' : `${Math.round(progressPercent)}%`}
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
                    <span className="theme-text-gray">{icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider theme-text-gray">{title}</span>
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
        <div className="px-4 py-4 h-full overflow-y-auto pb-24 theme-bg-base">
            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="mb-4">
                        <Sun size={28} strokeWidth={1.5} className="theme-text-gray" />
                    </div>
                    <span className="theme-text-gray text-md mb-6">No habits scheduled for today</span>
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
       <div className="pb-4 px-4 theme-border flex items-center justify-between theme-bg-base">
           <Button 
                clear
               onClick={() => onDateChange(subDays(currentDate, 7))} 
               className="w-10 h-10 rounded-2xl theme-text-gray"
           >
               <ChevronLeft size={20} />
           </Button>
           <span className="text-md font-semibold theme-text-base">
               {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
           </span>
           <Button 
                clear
               onClick={() => onDateChange(addDays(currentDate, 7))} 
               className="w-10 h-10 rounded-2xl theme-bg-card theme-text-gray"
           >
               <ChevronRight size={20} />
           </Button>
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

  const isCompact = style.width && parseFloat(style.width as string) < 50;

  return (
      <div
          className="absolute overflow-hidden cursor-pointer active:scale-[0.98] transition-transform rounded-lg border"
          title={`${event.name} (${event.startTime} - ${event.endTime})`}
          onClick={(e) => {
              e.stopPropagation();
              onEventClick(event.id, date);
          }}
          style={{ 
              ...style,
              borderColor: darkenColor(event.color, 0.15),
              background: lightenColor(event.color, 0.9),
          }}
      >
          {/* Icon */}
          <div className={`absolute ${isCompact ? 'top-1 left-1/2 -translate-x-1/2' : 'top-0.5 right-0.5'} z-10 theme-text-gray`}>
              <EventIcon name={event.icon} size={isCompact ? 12 : 10} />
          </div>
          
          {/* Event name */}
          {!isCompact && (
              <div className="pt-3 px-1 pb-1 relative z-10">
                  <span className="text-[10px] font-semibold leading-tight break-words line-clamp-3 theme-text-gray">
                      {event.name}
                  </span>
              </div>
          )}
          
          {/* Progress fill from bottom */}
          <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
              style={{ 
                  height: `${progress}%`, 
                  backgroundColor: event.color,
              }}
          />
      </div>
  );
}

export function WeekView({ currentDate }: { currentDate: Date }) {
   const start = startOfWeek(currentDate, { weekStartsOn: 0 });
   const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
   const hours = Array.from({ length: 24 }, (_, i) => i); // All 24 hours

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

   const calculateFullEventGeometry = (event: HabitEvent, firstHour: number) => {
       const [startH, startM] = event.startTime.split(':').map(Number);
       const [endH, endM] = event.endTime.split(':').map(Number);

       const totalStartMinutes = startH * 60 + startM;
       const totalEndMinutes = endH * 60 + endM;
       const durationMinutes = totalEndMinutes - totalStartMinutes;

       const firstHourStart = firstHour * 60;
       const topOffsetMinutes = totalStartMinutes - firstHourStart;

       const top = `${(topOffsetMinutes / 60) * 60 + 8}px`; // Added 8px offset for top padding
       const height = `${(durationMinutes / 60) * 60}px`;

       return { top, height };
   };

   return (
       <div className="h-full overflow-y-auto pb-16.5 theme-bg-base">
           {/* Header */}
           <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] sticky top-0 z-40 theme-bg-base theme-border">
               <div className="flex-shrink-0" />
               {days.map(d => {
                   const isToday = isSameDay(d, new Date());
                   return (
                       <div key={d.toString()} className="text-center py-2 min-w-0">
                           <div className="text-[10px] theme-text-muted font-bold uppercase">{format(d, 'EEEEE')}</div>
                           <div className={`text-sm font-bold ${isToday ? 'theme-text-accent' : 'theme-text-base'}`}>
                               {format(d, 'd')}
                           </div>
                       </div>
                   );
               })}
           </div>

           {/* Time grid with events overlay */}
           <div className="relative pt-2">
               {/* Hour rows */}
               {hours.map(hour => (
                   <div key={hour} className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] h-[60px] relative">
                       <div className="text-[10px] theme-text-muted text-right pr-2 flex items-start justify-end">
                           <span className="-translate-y-1/2">{hour}:00</span>
                       </div>
                       {days.map(d => (
                           <div key={d.toString()} className="border-l border-t relative min-w-0 theme-border-mute" />
                       ))}
                   </div>
               ))}

               {/* Events overlay */}
               <div className="absolute top-2 left-[3rem] right-0 bottom-0 pointer-events-none">
                   <div className="grid grid-cols-7 h-full">
                       {days.map(d => {
                           const dayEvents = getEventsForDay(d);
                           const positions = calculateEventPositions(dayEvents);

                           return (
                               <div key={d.toString()} className="relative min-w-0 pointer-events-auto">
                                   {dayEvents.map(event => {
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