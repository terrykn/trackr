import React, { useState, useMemo } from 'react';
import { Page } from "konsta/react";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
    format, addDays, subDays, startOfWeek, isSameDay,
    parseISO, isWithinInterval, getDay, differenceInCalendarWeeks,
    differenceInCalendarMonths, differenceInCalendarYears
} from 'date-fns';
import { getEvents, getEventProgress, isDateDeleted } from '../utils';
import type { HabitEvent } from '../utils';
import BottomNav from "../components/BottomNav";

// Helper to render dynamic icons
const EventIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
    const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;
    return Icon ? <Icon size={size} strokeWidth={2} /> : null;
};

// Check if event occurs on a specific date
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

interface TaskWithCompletion {
    event: HabitEvent;
    isCompleted: boolean;
    progress: number;
}

function WeeklySummaryCard({ currentDate }: { currentDate: Date }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    const allEvents = useMemo(() => getEvents(), []);

    const stats = useMemo(() => {
        let totalTasks = 0;
        let completedTasks = 0;

        weekDays.forEach(day => {
            const dateISO = format(day, 'yyyy-MM-dd');

            allEvents
                .filter(e => doesEventOccurOnDate(e, day))
                .filter(e => !isDateDeleted(e.id, dateISO))
                .forEach(event => {
                    totalTasks++;
                    const progress = getEventProgress(event.id, dateISO);
                    if (progress >= event.goalAmount) {
                        completedTasks++;
                    }
                });
        });

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Calculate current streak
        let currentStreak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        while (true) {
            const dateISO = format(checkDate, 'yyyy-MM-dd');

            const tasksForDay = allEvents
                .filter(e => doesEventOccurOnDate(e, checkDate))
                .filter(e => !isDateDeleted(e.id, dateISO));

            if (tasksForDay.length === 0) {
                checkDate = subDays(checkDate, 1);
                if (currentStreak === 0 && checkDate < subDays(new Date(), 7)) {
                    break;
                }
                continue;
            }

            const allCompleted = tasksForDay.every(event => {
                const progress = getEventProgress(event.id, dateISO);
                return progress >= event.goalAmount;
            });

            if (allCompleted) {
                currentStreak++;
                checkDate = subDays(checkDate, 1);
            } else {
                break;
            }

            if (currentStreak > 365) break;
        }

        return { totalTasks, completedTasks, completionRate, currentStreak };
    }, [weekDays, allEvents]);

    return (
        <div className="bg-white rounded-3xl p-4 mx-4 mt-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Weekly Summary</h3>
            <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.completedTasks}</div>
                    <div className="text-xs text-gray-500">Done</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
                    <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{stats.completionRate}%</div>
                    <div className="text-xs text-gray-500">Rate</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{stats.currentStreak}🔥</div>
                    <div className="text-xs text-gray-500">Streak</div>
                </div>
            </div>
        </div>
    );
}

function WeeklyCompletionChart({ currentDate, onDateChange }: { currentDate: Date, onDateChange: (d: Date) => void }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    const allEvents = useMemo(() => getEvents(), []);

    const weekData = useMemo(() => {
        return weekDays.map(day => {
            const dateISO = format(day, 'yyyy-MM-dd');

            const tasksForDay: TaskWithCompletion[] = allEvents
                .filter(e => doesEventOccurOnDate(e, day))
                .filter(e => !isDateDeleted(e.id, dateISO))
                .map(event => {
                    const progress = getEventProgress(event.id, dateISO);
                    const isCompleted = progress >= event.goalAmount;
                    return { event, isCompleted, progress };
                })
                .sort((a, b) => {
                    if (a.isCompleted === b.isCompleted) return 0;
                    return a.isCompleted ? -1 : 1;
                });

            return {
                date: day,
                dateISO,
                tasks: tasksForDay
            };
        });
    }, [weekDays, allEvents]);

    const maxTasks = Math.max(...weekData.map(d => d.tasks.length), 1);

    return (
        <div className="bg-white rounded-3xl p-4 mx-4 mt-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => onDateChange(subDays(currentDate, 7))}
                    className="p-1.5 text-gray-400 hover:text-black active:scale-95 transition-transform"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-base font-semibold text-gray-800">
                    {format(start, 'MMM d')} - {format(addDays(start, 6), 'MMM d, yyyy')}
                </span>
                <button
                    onClick={() => onDateChange(addDays(currentDate, 7))}
                    className="p-1.5 text-gray-400 hover:text-black active:scale-95 transition-transform"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="flex justify-between items-end gap-1" style={{ minHeight: `${maxTasks * 28 + 40}px` }}>
                {weekData.map(({ date, tasks }) => {
                    const isToday = isSameDay(date, new Date());

                    return (
                        <div key={date.toString()} className="flex-1 flex flex-col items-center">
                            <div className="flex flex-col-reverse items-center gap-0.5 mb-2">
                                {tasks.length === 0 ? (
                                    <div className="w-7 h-6" />
                                ) : (
                                    tasks.map(({ event, isCompleted }) => (
                                        <div
                                            key={event.id}
                                            className={`w-7 h-6 rounded-lg flex items-center justify-center transition-all ${isCompleted
                                                    ? 'text-white'
                                                    : 'bg-gray-100 text-gray-400'
                                                }`}
                                            style={isCompleted ? {
                                                backgroundColor: darkenColor(event.color, 0.15)
                                            } : undefined}
                                            title={`${event.name} - ${isCompleted ? 'Completed' : 'Incomplete'}`}
                                        >
                                            <EventIcon name={event.icon} size={14} />
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={`flex flex-col items-center ${isToday ? 'text-gray-900' : 'text-gray-500'}`}>
                                <span className={`text-[10px] font-semibold uppercase ${isToday ? 'text-gray-900' : ''}`}>
                                    {format(date, 'EEE')}
                                </span>
                                <span className={`text-sm font-bold ${isToday ? 'text-gray-900' : ''}`}>
                                    {format(date, 'd')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TaskBreakdownCard({ currentDate }: { currentDate: Date }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const allEvents = useMemo(() => getEvents(), []);

    // Get unique tasks that appear at least once during this week
    const tasksThisWeek = useMemo(() => {
        const taskMap = new Map<string, HabitEvent>();

        weekDays.forEach(day => {
            const dateISO = format(day, 'yyyy-MM-dd');

            allEvents
                .filter(e => doesEventOccurOnDate(e, day))
                .filter(e => !isDateDeleted(e.id, dateISO))
                .forEach(event => {
                    if (!taskMap.has(event.id)) {
                        taskMap.set(event.id, event);
                    }
                });
        });

        return Array.from(taskMap.values());
    }, [weekDays, allEvents]);

    // Get progress for each task for each day
    const getTaskDayData = (event: HabitEvent, day: Date) => {
        const dateISO = format(day, 'yyyy-MM-dd');
        const occurs = doesEventOccurOnDate(event, day) && !isDateDeleted(event.id, dateISO);

        if (!occurs) {
            return { occurs: false, progress: 0, isCompleted: false };
        }

        const progress = getEventProgress(event.id, dateISO);
        const isCompleted = progress >= event.goalAmount;

        return { occurs: true, progress, isCompleted };
    };

    // Format repeat schedule text
    const getScheduleText = (event: HabitEvent) => {
        const timesPerCycle = event.repeatDays?.length || 0;

        if (event.repeatFrequency === 'week') {
            if (event.repeatEvery === 1) {
                return `${timesPerCycle}x / week`;
            }
            return `${timesPerCycle}x / ${event.repeatEvery} weeks`;

        } else if (event.repeatFrequency === 'month') {
            if (event.repeatEvery === 1) {
                return `${timesPerCycle}x / month`;
            }
            return `${timesPerCycle}x / ${event.repeatEvery} months`;

        } else if (event.repeatFrequency === 'year') {
            if (event.repeatEvery === 1) {
                return `${timesPerCycle}x / year`;
            }
            return `${timesPerCycle}x / ${event.repeatEvery} years`;
        }

        return 'Once';
    };

    if (tasksThisWeek.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-4 mx-4 mt-4 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Task Breakdown</h3>
                <p className="text-gray-400 text-sm text-center py-4">No tasks scheduled this week</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-5 mx-4 mt-4 border border-gray-100">
            <div className="flex items-center mb-1 gap-2 border-gray-50">
                <div className="flex-1" />
                <div className="flex gap-1 flex-shrink-0">
                    {dayLabels.map((label, i) => {
                        const isToday = isSameDay(weekDays[i], new Date());
                        return (
                            <div
                                key={i}
                                className={`w-7 text-center text-xs font-semibold ${isToday ? 'text-gray-900' : 'text-gray-400'
                                    }`}
                            >
                                {label}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Task rows */}
            <div className="space-y-2">
                {tasksThisWeek.map(event => {
                    const darkerColor = darkenColor(event.color, 0.15);

                    return (
                        <div key={event.id} className="flex items-center gap-2">
                            {/* Task info - takes remaining space */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{event.name}</p>
                                <p className="text-xs font-medium text-gray-600 leading-tight line-clamp-2">{getScheduleText(event)}</p>
                                
                            </div>

                            {/* Progress icons for each day */}
                            <div className="flex gap-1 flex-shrink-0">
                                {weekDays.map((day, i) => {
                                    const { occurs, isCompleted } = getTaskDayData(event, day);

                                    if (!occurs) {
                                        return (
                                            <div
                                                key={i}
                                                className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center"
                                            >
                                                <span className="text-gray-200 text-[10px]">–</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={i}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isCompleted
                                                    ? 'text-white'
                                                    : 'bg-gray-100 text-gray-400'
                                                }`}
                                            style={isCompleted ? {
                                                backgroundColor: darkerColor
                                            } : undefined}
                                            title={`${event.name} - ${isCompleted ? 'Completed' : 'Incomplete'}`}
                                        >
                                            <EventIcon name={event.icon} size={14} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function StatsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <Page className="flex flex-col min-h-screen bg-gray-50">
            <div className="flex-1 overflow-y-auto pb-24 pt-4">
                {/* Weekly Stats Summary */}
                <WeeklySummaryCard currentDate={currentDate} />

                {/* Weekly Completion Chart */}
                <WeeklyCompletionChart
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                />

                {/* Task Breakdown */}
                <TaskBreakdownCard currentDate={currentDate} />
            </div>
            <BottomNav />
        </Page>
    );
}