import { useState, useEffect, useRef } from 'react';
import { Page, Sheet, Block, Button } from "konsta/react";
import { Play, Pause, RotateCcw, Square, Plus, X } from 'lucide-react';
import BottomNav from "../components/BottomNav";
import { getEvents, updateEventProgress, getEventProgress, lightenColor, darkenColor } from '../utils';
import { format } from 'date-fns';
import type { HabitEvent } from '../utils';
import EventIcon from '../components/EventIcon';

type TimerMode = 'focus' | 'break';
type TimerState = 'idle' | 'running' | 'paused';

const TIME_UNITS = ['minutes', 'mins', 'min', 'hours', 'hrs', 'hr', 'seconds', 'secs', 'sec'];

const isTimeUnit = (unit: string): boolean => {
    return TIME_UNITS.includes(unit.toLowerCase());
};

const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    } else if (mins > 0) {
        return `${mins}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
};

const convertToUnit = (seconds: number, unit: string): number => {
    const lowerUnit = unit.toLowerCase();
    if (['hours', 'hrs', 'hr'].includes(lowerUnit)) {
        return Math.round((seconds / 3600) * 10) / 10;
    } else if (['minutes', 'mins', 'min'].includes(lowerUnit)) {
        return Math.round(seconds / 60);
    } else if (['seconds', 'secs', 'sec'].includes(lowerUnit)) {
        return seconds;
    }
    return Math.round(seconds / 60);
};

export default function Timer() {
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(60 * 60);
    const [initialTime, setInitialTime] = useState(60 * 60);
    const [timerState, setTimerState] = useState<TimerState>('idle');
    const [selectedTask, setSelectedTask] = useState<HabitEvent | null>(null);
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [customHours, setCustomHours] = useState(0);
    const [customMinutes, setCustomMinutes] = useState(60);
    const [customSeconds, setCustomSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const availableTasks = getEvents().filter(event => {
        const today = new Date();
        const todayDay = today.getDay();

        if (event.repeatFrequency === 'week' && event.repeatDays.includes(todayDay)) {
            return true;
        }
        if (event.repeatFrequency === 'day') {
            return true;
        }
        return false;
    });

    const presetOptions = [5, 15, 25, 60];
    const activePreset = presetOptions.find(minutes => minutes * 60 === timeLeft);

    useEffect(() => {
        if (timerState === 'running' && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setTimerState('idle');
                        const totalElapsed = initialTime;
                        setElapsedTime(totalElapsed);
                        handleTimerComplete(totalElapsed);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [timerState, timeLeft, initialTime]);

    const handleTimerComplete = (elapsed: number) => {
        setElapsedTime(elapsed);
        if (selectedTask && mode === 'focus' && isTimeUnit(selectedTask.goalUnit)) {
            setShowFinishModal(true);
        }

        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    };

    const handleFinishAndSave = () => {
        if (selectedTask && isTimeUnit(selectedTask.goalUnit)) {
            const today = format(new Date(), 'yyyy-MM-dd');
            const currentProgress = getEventProgress(selectedTask.id, today);
            const progressToAdd = convertToUnit(elapsedTime, selectedTask.goalUnit);
            updateEventProgress(selectedTask.id, today, currentProgress + progressToAdd);
        }
        setShowFinishModal(false);
        setTimeLeft(initialTime);
        setElapsedTime(0);
    };

    const handleFinishWithoutSaving = () => {
        setShowFinishModal(false);
        setTimeLeft(initialTime);
        setElapsedTime(0);
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        if (timerState === 'idle') {
            setTimerState('running');
        } else if (timerState === 'paused') {
            setTimerState('running');
        }
    };

    const handlePause = () => {
        if (timerState === 'running') {
            setTimerState('paused');
        }
    };

    const handleStop = () => {
        if (timerState !== 'idle') {
            const elapsed = initialTime - timeLeft;
            setElapsedTime(elapsed);
            setTimerState('idle');

            if (selectedTask && mode === 'focus' && isTimeUnit(selectedTask.goalUnit) && elapsed > 0) {
                setShowFinishModal(true);
            } else {
                setTimeLeft(initialTime);
            }
        }
    };

    const handleReset = () => {
        setTimerState('idle');
        setTimeLeft(initialTime);
        setElapsedTime(0);
    };

    const setPresetTime = (minutes: number) => {
        const seconds = minutes * 60;
        setTimeLeft(seconds);
        setInitialTime(seconds);
        setTimerState('idle');
    };

    const handleCustomTimeSet = () => {
        const totalSeconds = customHours * 3600 + customMinutes * 60 + customSeconds;
        setTimeLeft(totalSeconds);
        setInitialTime(totalSeconds);
        setShowTimePicker(false);
        setTimerState('idle');
    };

    const handleTimerClick = () => {
        if (timerState === 'idle') {
            setCustomHours(Math.floor(timeLeft / 3600));
            setCustomMinutes(Math.floor((timeLeft % 3600) / 60));
            setCustomSeconds(timeLeft % 60);
            setShowTimePicker(true);
        }
    };

    return (
        <Page className="relative flex flex-col min-h-screen theme-bg-base">
            {/* Fixed Mode Toggle at Top */}
            <div className="absolute top-8 left-0 right-0 z-10 px-6">
                <div className="flex justify-center">
                    <div className="rounded-full p-1 flex gap-1 border theme-border theme-bg-card">
                        <button
                            onClick={() => setMode('focus')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all border ${mode === 'focus'
                                    ? 'theme-bg-gray text-white border-transparent'
                                    : 'theme-text-muted border-transparent'
                                }`}
                        >
                            Focus
                        </button>
                        <button
                            onClick={() => setMode('break')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all border ${mode === 'break'
                                    ? 'theme-bg-gray text-white border-transparent'
                                    : 'theme-text-muted border-transparent'
                                }`}
                        >
                            Break
                        </button>
                    </div>
                </div>
            </div>

            {/* Centered Timer Section */}
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="flex flex-col items-center">
                    {/* Add Task Button */}
                    <div className="mb-6">
                        <button
                            onClick={() => setShowTaskPicker(true)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-2xl text-sm font-medium border theme-border active:scale-95 transition-transform"
                            style={selectedTask ? {
                                backgroundColor: lightenColor(selectedTask.color, 0.75)
                            } : undefined}
                        >
                            {selectedTask ? (
                                <>
                                    <span
                                        className="w-3.5 h-3.5 rounded-full"
                                        style={{ backgroundColor: darkenColor(selectedTask.color, 0.05) }}
                                    />
                                    <span className="truncate max-w-32 theme-text-base">{selectedTask.name}</span>
                                    <span
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTask(null);
                                        }}
                                        className="ml-1 p-0.5 rounded-full theme-text-muted hover:theme-bg-secondary cursor-pointer"
                                    >
                                        <X size={14} />
                                    </span>
                                </>
                            ) : (
                                <span className="theme-text-muted flex items-center gap-2">
                                    <Plus size={16} />
                                    Add Task
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Timer Display */}
                    <button
                        onClick={handleTimerClick}
                        className={`text-8xl font-extralight tracking-tight theme-text-base transition-transform ${timerState === 'idle' ? 'active:scale-95' : ''
                            }`}
                        disabled={timerState !== 'idle'}
                    >
                        {formatTime(timeLeft)}
                    </button>

                    {/* Preset Time Badges */}
                    <div className="flex justify-center gap-2 mt-6 mb-12">
                        {presetOptions.map(minutes => (
                            <button
                                key={minutes}
                                onClick={() => setPresetTime(minutes)}
                                className={`px-3.5 py-1.5 rounded-2xl text-sm font-semibold transition-all border ${timerState === 'idle'
                                        ? activePreset === minutes
                                            ? 'theme-bg-gray text-white border-transparent'
                                            : 'theme-text-base theme-border active:scale-95'
                                        : 'theme-text-muted theme-border opacity-50'
                                    }`}
                                disabled={timerState !== 'idle'}
                            >
                                {minutes}
                            </button>
                        ))}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex justify-center gap-4">
                        {timerState === 'idle' && (
                            <button
                                onClick={handleStart}
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform border theme-border bg-green-500"
                            >
                                <Play size={24} fill="white" />
                            </button>
                        )}

                        {timerState === 'running' && (
                            <>
                                <button
                                    onClick={handlePause}
                                    className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform border theme-border"
                                >
                                    <Pause size={24} fill="white" />
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform border theme-border"
                                >
                                    <Square size={20} fill="white" />
                                </button>
                            </>
                        )}

                        {timerState === 'paused' && (
                            <>
                                <button
                                    onClick={handleStart}
                                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform border theme-border"
                                >
                                    <Play size={24} fill="white" />
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform border theme-border"
                                >
                                    <Square size={20} fill="white" />
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="w-16 h-16 theme-bg-card rounded-full flex items-center justify-center theme-text-muted active:scale-95 transition-transform border theme-border"
                                >
                                    <RotateCcw size={22} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Picker Sheet */}
            <Sheet
                opened={showTaskPicker}
                onBackdropClick={() => setShowTaskPicker(false)}
                className="pb-safe theme-bg-base"
            >
                <Block className="!mt-0 pt-4 pb-20 max-h-[70vh] overflow-y-auto">
                    <p className="text-xl font-bold mb-4 text-center theme-text-base">Select Task</p>

                    {availableTasks.length === 0 ? (
                        <div className="rounded-2xl theme-bg-card border theme-border p-6 text-center">
                            <p className="theme-text-muted">No tasks available for today</p>
                        </div>
                    ) : (
                        <>
                            {/* Time-based tasks */}
                            {availableTasks.filter(t => isTimeUnit(t.goalUnit)).length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-semibold theme-text-muted uppercase tracking-wider mb-2 px-1">
                                        TIME-BASED TASKS
                                    </p>
                                    <div className="rounded-2xl theme-bg-card border theme-border p-2 space-y-1">
                                        {availableTasks.filter(t => isTimeUnit(t.goalUnit)).map(task => (
                                            <button
                                                key={task.id}
                                                onClick={() => setSelectedTask(task)}
                                                className={`w-full text-left px-2 py-2.5 rounded-xl transition-all flex items-center gap-3 ${selectedTask?.id === task.id
                                                        ? 'border-current'
                                                        : 'border-transparent active:theme-bg-secondary'
                                                    }`}
                                                style={selectedTask?.id === task.id ? { borderColor: task.color } : undefined}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: lightenColor(task.color, 0.3) }}
                                                >
                                                    <EventIcon name={task.icon} size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate theme-text-base">
                                                        {task.name}
                                                    </div>
                                                    <div className="text-xs theme-text-muted">
                                                        Goal: {task.goalAmount} {task.goalUnit}
                                                    </div>
                                                </div>
                                                <div
                                                    className={`w-6 h-6 rounded-full flex-shrink-0 border-2 flex items-center justify-center`}
                                                    style={{ borderColor: darkenColor(task.color, 0.15) }}
                                                >
                                                    {selectedTask?.id === task.id && (
                                                        <div
                                                            className="w-3.5 h-3.5 rounded-full"
                                                            style={{ backgroundColor: darkenColor(task.color, 0.15) }}
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Non-time-based tasks */}
                            {availableTasks.filter(t => !isTimeUnit(t.goalUnit)).length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-semibold theme-text-muted uppercase tracking-wider mb-2 px-1">
                                        OTHER TASKS
                                    </p>
                                    <div className="rounded-2xl theme-bg-card border theme-border p-2 space-y-1">
                                        {availableTasks.filter(t => !isTimeUnit(t.goalUnit)).map(task => (
                                            <button
                                                key={task.id}
                                                onClick={() => setSelectedTask(task)}
                                                className={`w-full text-left px-2 py-2.5 rounded-xl transition-all flex items-center gap-3 ${selectedTask?.id === task.id
                                                        ? 'border-current'
                                                        : 'border-transparent active:theme-bg-secondary'
                                                    }`}
                                                style={selectedTask?.id === task.id ? { borderColor: task.color } : undefined}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: lightenColor(task.color, 0.3) }}
                                                >
                                                    <EventIcon name={task.icon} size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate theme-text-base">
                                                        {task.name}
                                                    </div>
                                                    <div className="text-xs theme-text-muted">
                                                        Goal: {task.goalAmount} {task.goalUnit}
                                                        <span className="ml-1 opacity-50">(won't track time)</span>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`w-6 h-6 rounded-full flex-shrink-0 border-2 flex items-center justify-center`}
                                                    style={{ borderColor: darkenColor(task.color, 0.15) }}
                                                >
                                                    {selectedTask?.id === task.id && (
                                                        <div
                                                            className="w-3.5 h-3.5 rounded-full"
                                                            style={{ backgroundColor: darkenColor(task.color, 0.15) }}
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <Button
                        large
                        rounded
                        onClick={() => setShowTaskPicker(false)}
                        className="mt-4 theme-bg-secondary theme-text-gray font-bold"
                    >
                        Close
                    </Button>
                </Block>
            </Sheet>

            {/* Time Picker Sheet */}
            <Sheet
                opened={showTimePicker}
                onBackdropClick={() => setShowTimePicker(false)}
                className="pb-safe theme-bg-base"
            >
                <Block className="!mt-0 pt-4 pb-20">
                    <p className="text-xl font-bold mb-6 text-center theme-text-base">Set Timer</p>

                    <div className="flex justify-center gap-3 mb-8">
                        <div className="text-center">
                            <label className="text-sm theme-text-muted block mb-2">Hours</label>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                value={customHours}
                                onChange={(e) => setCustomHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-16 h-12 text-2xl text-center rounded-2xl outline-none border theme-border theme-text-base theme-bg-card"
                            />
                        </div>
                        <div className="flex items-end pb-3">
                            <span className="text-2xl font-light theme-text-muted">:</span>
                        </div>
                        <div className="text-center">
                            <label className="text-sm theme-text-muted block mb-2">Minutes</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={customMinutes}
                                onChange={(e) => setCustomMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-16 h-12 text-2xl text-center rounded-2xl outline-none border theme-border theme-text-base theme-bg-card"
                            />
                        </div>
                        <div className="flex items-end pb-3">
                            <span className="text-2xl font-light theme-text-muted">:</span>
                        </div>
                        <div className="text-center">
                            <label className="text-sm theme-text-muted block mb-2">Seconds</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={customSeconds}
                                onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-16 h-12 text-2xl text-center rounded-2xl outline-none border theme-border theme-text-base theme-bg-card"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            large
                            rounded
                            onClick={() => setShowTimePicker(false)}
                            className="flex-1 theme-bg-secondary theme-text-gray font-bold border theme-border"
                        >
                            Cancel
                        </Button>
                        <Button
                            large
                            rounded
                            onClick={handleCustomTimeSet}
                            className="flex-1 theme-bg-primary theme-text-gray font-bold border theme-border"
                        >
                            Set Timer
                        </Button>
                    </div>
                </Block>
            </Sheet>

            {/* Finish Session Sheet */}
            <Sheet
                opened={showFinishModal}
                onBackdropClick={() => { }}
                className="pb-safe theme-bg-base"
            >
                <Block className="!mt-0 pt-4 pb-20">
                    <p className="text-xl font-bold mb-2 text-center theme-text-base">Session Complete!</p>
                    <p className="theme-text-muted text-center mb-6">
                        You focused for <span className="font-semibold theme-text-base">{formatElapsedTime(elapsedTime)}</span>
                    </p>

                    {selectedTask && isTimeUnit(selectedTask.goalUnit) && (
                        <div
                            className="rounded-2xl p-4 mb-6 border theme-border theme-bg-card"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: lightenColor(selectedTask.color, 0.3) }}
                                >
                                    <EventIcon name={selectedTask.icon} size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm theme-text-muted">Add to task:</p>
                                    <p className="font-semibold theme-text-base">{selectedTask.name}</p>
                                </div>
                            </div>
                            <div
                                className="mt-3 pt-3 border-t text-center theme-border"
                            >
                                <span className="text-lg font-bold theme-text-gray">
                                    +{convertToUnit(elapsedTime, selectedTask.goalUnit)} {selectedTask.goalUnit}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Button
                            large
                            rounded
                            onClick={handleFinishAndSave}
                            className="font-bold border theme-bg-primary theme-border theme-text-gray"
                        >
                            Save Progress
                        </Button>
                        <Button
                            large
                            rounded
                            onClick={handleFinishWithoutSaving}
                            className="theme-bg-secondary theme-text-gray font-bold"
                        >
                            Discard
                        </Button>
                    </div>
                </Block>
            </Sheet>

            <BottomNav />
        </Page>
    );
}