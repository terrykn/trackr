import React, { useState, useMemo } from 'react';
import { Page } from "konsta/react";
import * as LucideIcons from 'lucide-react';
import {
    format, addDays, startOfWeek, isSameDay,
    parseISO, isWithinInterval, getDay, differenceInCalendarWeeks,
    differenceInCalendarMonths, differenceInCalendarYears
} from 'date-fns';
import { getEvents, getEventProgress, isDateDeleted, darkenColor } from '../utils';
import type { HabitEvent } from '../utils';
import BottomNav from "../components/BottomNav";
import WeeklySummaryCard from '../components/WeeklySummaryCard';
import WeeklyCompletionChart from '../components/WeeklyCompletionChart';
import TaskBreakdownCard from '../components/TaskBreakdownCard';

// Helper to render dynamic icons
const EventIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
    const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;
    return Icon ? <Icon size={size} strokeWidth={2.5} /> : null;
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

export default function StatsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <Page className="flex flex-col min-h-screen theme-bg-base">
            <div className="flex-1 overflow-y-auto pb-32 pt-4">
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