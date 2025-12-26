import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { doesEventOccurOnDate, getEventProgress, getEvents, isDateDeleted, type HabitEvent } from "../utils";
import EventIcon from "./EventIcon";
import { useMemo } from "react";
import { Minus } from "lucide-react";

export default function TaskBreakdownCard({ currentDate }: { currentDate: Date }) {
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
            <div className="rounded-2xl p-inner mx-screen mb-container theme-bg-card relative border theme-border">
                <h3 className="text-sm font-semibold theme-text-muted uppercase tracking-wide mb-3">Task Breakdown</h3>
                <p className="theme-text-muted text-sm text-center py-4">No tasks scheduled this week</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-inner mx-screen mb-container theme-bg-card relative border theme-border">
            <div className="flex items-center mb-3 gap-2">
                <div className="flex-1">
                    <h3 className="text-sm font-semibold theme-text-muted uppercase tracking-wide">Tasks</h3>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    {dayLabels.map((label, i) => {
                        const isToday = isSameDay(weekDays[i], new Date());
                        return (
                            <div
                                key={i}
                                className={`w-7 text-center text-[10px] font-bold ${isToday ? 'theme-text-gray' : 'theme-text-light-gray'
                                    }`}
                            >
                                {label}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Task rows with more padding */}
            <div className="space-y-4">
                {tasksThisWeek.map(event => {
                    return (
                        <div key={event.id} className="flex items-center gap-2 w-full">
                            {/* Task info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold theme-text-gray leading-tight truncate">{event.name}</p>
                                <p className="text-[10px] font-medium theme-text-muted leading-tight mt-0.5">{getScheduleText(event)}</p>
                            </div>

                            {/* Progress icons for each day */}
                            <div className="flex gap-1 flex-shrink-0">
                                {weekDays.map((day, i) => {
                                    const { occurs, isCompleted } = getTaskDayData(event, day);

                                    if (!occurs) {
                                        return (
                                            <div
                                                key={i}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center theme-bg-light-gray theme-text-muted"
                                            >
                                                <Minus size={14} />
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={i}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isCompleted ? 'theme-text-gray' : 'theme-bg-light-gray theme-text-muted'}`}
                                            style={isCompleted ? {
                                                backgroundColor: event.color,
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