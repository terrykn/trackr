import { addDays, format, isSameDay, startOfWeek, subDays } from "date-fns";
import { useMemo } from "react";
import { darkenColor, doesEventOccurOnDate, getEventProgress, getEvents, isDateDeleted, type TaskWithCompletion } from "../utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EventIcon from "./EventIcon";


export default function WeeklyCompletionChart({ currentDate, onDateChange }: { currentDate: Date, onDateChange: (d: Date) => void }) {
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
        <div className="theme-bg-card rounded-2xl p-3.5 mx-4 mt-4 border theme-border">
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => onDateChange(subDays(currentDate, 7))}
                    className="p-1.5 theme-text-muted hover:text-black active:scale-95 transition-transform"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-base font-semibold theme-text-gray">
                    {format(start, 'MMM d')} - {format(addDays(start, 6), 'MMM d, yyyy')}
                </span>
                <button
                    onClick={() => onDateChange(addDays(currentDate, 7))}
                    className="p-1.5 theme-text-muted hover:text-black active:scale-95 transition-transform"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="flex justify-between items-end gap-1" style={{ minHeight: `${maxTasks * 32 + 40}px` }}>
                {weekData.map(({ date, tasks }) => {
                    const isToday = isSameDay(date, new Date());

                    return (
                        <div key={date.toString()} className="flex-1 flex flex-col items-center">
                            <div className="flex flex-col-reverse items-center gap-1 mb-2">
                                {tasks.length === 0 ? (
                                    <div className="w-7 h-7" />
                                ) : (
                                    tasks.map(({ event, isCompleted }) => (
                                        <div
                                            key={event.id}
                                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${isCompleted ? 'theme-text-gray' : 'theme-bg-light-gray theme-border-mute text-gray-400'}`}
                                            style={isCompleted ? {
                                                backgroundColor: event.color,
                                                borderColor: darkenColor(event.color, 0.3),
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