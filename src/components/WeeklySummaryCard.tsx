import {
    format, addDays, subDays, startOfWeek, isToday
} from 'date-fns';
import { useMemo } from 'react';
import { 
    doesEventOccurOnDate, 
    getEventProgress, 
    getEvents, 
    isDateDeleted, 
    isDailyCompletionMet 
} from '../utils';

export default function WeeklySummaryCard({ currentDate }: { currentDate: Date }) {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    const allEvents = useMemo(() => getEvents(), []);

    const stats = useMemo(() => {
        let totalTasks = 0;
        let completedTasks = 0;

        // 1. Calculate Weekly Stats
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

        // 2. Calculate Current Streak using the utility function
        let currentStreak = 0;
        let checkDate = new Date(); // Start from "Today"
        checkDate.setHours(0, 0, 0, 0);

        while (true) {
            const isMet = isDailyCompletionMet(checkDate);

            if (isMet) {
                currentStreak++;
                checkDate = subDays(checkDate, 1);
            } else {
                // If it's today and we haven't finished yet, don't break the streak,
                // just move to yesterday to see if the streak is still alive.
                if (isToday(checkDate)) {
                    checkDate = subDays(checkDate, 1);
                    continue;
                }
                // If it's not today and tasks weren't met, the streak is broken.
                break;
            }

            // Safety break
            if (currentStreak > 4000) break;
        }

        return { totalTasks, completedTasks, completionRate, currentStreak };
    }, [weekDays, allEvents]);

    return (
        <div className="theme-bg-card rounded-2xl p-3.5 mx-4 mt-4 border theme-border">
            <h3 className="text-sm font-semibold theme-text-muted uppercase tracking-wide mb-3">Weekly Summary</h3>
            <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                    <div className="text-2xl font-bold theme-text-gray">{stats.completedTasks}</div>
                    <div className="text-xs theme-text-muted">Done</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold theme-text-gray">{stats.totalTasks}</div>
                    <div className="text-xs theme-text-muted">Total</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold theme-text-gray">{stats.completionRate}%</div>
                    <div className="text-xs theme-text-muted">Rate</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold theme-text-gray">{stats.currentStreak}</div>
                    <div className="text-xs theme-text-muted">Streak</div>
                </div>
            </div>
        </div>
    );
}