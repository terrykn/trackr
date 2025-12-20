import { useState, useEffect, useRef } from 'react';
import { Page } from "konsta/react";
import { Play, Pause, RotateCcw, Square, Plus, X } from 'lucide-react';
import BottomNav from "../components/BottomNav";
import { getEvents, updateEventProgress, getEventProgress } from '../utils';
import { format } from 'date-fns';
import type { HabitEvent } from '../utils';

type TimerMode = 'focus' | 'break';
type TimerState = 'idle' | 'running' | 'paused';

// Time-based units that the timer can add progress to
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
        return Math.round((seconds / 3600) * 10) / 10; // Round to 1 decimal
    } else if (['minutes', 'mins', 'min'].includes(lowerUnit)) {
        return Math.round(seconds / 60);
    } else if (['seconds', 'secs', 'sec'].includes(lowerUnit)) {
        return seconds;
    }
    return Math.round(seconds / 60); // Default to minutes
};

export default function Timer() {
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(60 * 60); // Default 60:00
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

    // Get available tasks from calendar events
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

    // Check if current time matches preset options
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
        <Page className="relative flex flex-col min-h-screen bg-gray-50">
            {/* Fixed Mode Toggle at Top */}
            <div className="absolute top-8 left-0 right-0 z-10 px-6">
                <div className="flex justify-center">
                    <div className=" rounded-full p-1 flex gap-1">
                        <button
                            onClick={() => setMode('focus')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                                mode === 'focus'
                                    ? 'bg-black text-white'
                                    : 'text-gray-600'
                            }`}
                        >
                            Focus
                        </button>
                        <button
                            onClick={() => setMode('break')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                                mode === 'break'
                                    ? 'bg-black text-white'
                                    : 'text-gray-600'
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
                    <div className="mb-8">
                        <button
                            onClick={() => setShowTaskPicker(true)}
                            className="flex items-center gap-2 px-4 py-2  rounded-full text-sm font-medium text-gray-700 active:scale-95 transition-transform"
                        >
                            {selectedTask ? (
                                <>
                                    <span className="truncate max-w-32">{selectedTask.name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTask(null);
                                        }}
                                        className="ml-1 p-0.5 rounded-full hover:bg-gray-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    Add Task
                                </>
                            )}
                        </button>
                    </div>

                    {/* Timer Display */}
                    <button
                        onClick={handleTimerClick}
                        className={`text-8xl font-extralight tracking-tight text-gray-900 transition-transform ${
                            timerState === 'idle' ? 'active:scale-95' : ''
                        }`}
                        disabled={timerState !== 'idle'}
                    >
                        {formatTime(timeLeft)}
                    </button>

                    {/* Preset Time Badges */}
                    <div className="flex justify-center gap-3 mt-8 mb-12">
                        {presetOptions.map(minutes => (
                            <button
                                key={minutes}
                                onClick={() => setPresetTime(minutes)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                    timerState === 'idle'
                                        ? activePreset === minutes
                                            ? 'bg-black text-white'
                                            : ' text-gray-700 active:scale-95'
                                        : ' text-gray-400'
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
                                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                            >
                                <Play size={24} fill="white" />
                            </button>
                        )}

                        {timerState === 'running' && (
                            <>
                                <button
                                    onClick={handlePause}
                                    className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                                >
                                    <Pause size={24} fill="white" />
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                                >
                                    <Square size={20} fill="white" />
                                </button>
                            </>
                        )}

                        {timerState === 'paused' && (
                            <>
                                <button
                                    onClick={handleStart}
                                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                                >
                                    <Play size={24} fill="white" />
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                                >
                                    <Square size={20} fill="white" />
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                                >
                                    <RotateCcw size={22} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Picker Modal */}
            {showTaskPicker && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
                    <div className=" rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 pb-0">
                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                            <h3 className="text-lg font-semibold mb-4">Select Task</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6">
                            <div className="space-y-2 pb-4">
                                {availableTasks.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No tasks available for today</p>
                                ) : (
                                    availableTasks.map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setShowTaskPicker(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-2xl transition-all ${
                                                selectedTask?.id === task.id
                                                    ? 'bg-black text-white'
                                                    : '!bg-gray-100 text-gray-900 active:bg-gray-200'
                                            }`}
                                        >
                                            <div className="font-medium">{task.name}</div>
                                            <div className="text-sm opacity-70">
                                                Goal: {task.goalAmount} {task.goalUnit}
                                                {!isTimeUnit(task.goalUnit) && (
                                                    <span className="ml-2 text-xs opacity-50">(non-time unit)</span>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="p-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowTaskPicker(false)}
                                className="w-full py-3 bg-gray-100 rounded-2xl font-semibold text-gray-700 active:bg-gray-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
                    <div className=" rounded-3xl w-full max-w-md p-6">
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                        <h3 className="text-lg font-semibold mb-6 text-center">Set Timer</h3>

                        <div className="flex justify-center gap-3 mb-8">
                            <div className="text-center">
                                <label className="text-sm text-gray-600 block mb-2">Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={customHours}
                                    onChange={(e) => setCustomHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-16 h-12 text-2xl text-center bg-gray-100 rounded-2xl outline-none"
                                />
                            </div>
                            <div className="flex items-end pb-3">
                                <span className="text-2xl font-light">:</span>
                            </div>
                            <div className="text-center">
                                <label className="text-sm text-gray-600 block mb-2">Minutes</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={customMinutes}
                                    onChange={(e) => setCustomMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-16 h-12 text-2xl text-center bg-gray-100 rounded-2xl outline-none"
                                />
                            </div>
                            <div className="flex items-end pb-3">
                                <span className="text-2xl font-light">:</span>
                            </div>
                            <div className="text-center">
                                <label className="text-sm text-gray-600 block mb-2">Seconds</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={customSeconds}
                                    onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-16 h-12 text-2xl text-center bg-gray-100 rounded-2xl outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTimePicker(false)}
                                className="flex-1 py-3 bg-gray-100 rounded-2xl font-semibold text-gray-700 active:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCustomTimeSet}
                                className="flex-1 py-3 bg-black text-white rounded-2xl font-semibold active:opacity-80"
                            >
                                Set Timer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Finish Session Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
                    <div className=" rounded-3xl w-full max-w-sm p-6">
                        <h3 className="text-xl font-semibold mb-2 text-center">Session Complete!</h3>
                        <p className="text-gray-600 text-center mb-6">
                            You focused for <span className="font-semibold text-black">{formatElapsedTime(elapsedTime)}</span>
                        </p>

                        {selectedTask && isTimeUnit(selectedTask.goalUnit) && (
                            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                                <p className="text-sm text-gray-600 mb-1">Add to task:</p>
                                <p className="font-semibold">{selectedTask.name}</p>
                                <p className="text-sm text-gray-500">
                                    +{convertToUnit(elapsedTime, selectedTask.goalUnit)} {selectedTask.goalUnit}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleFinishAndSave}
                                className="w-full py-3 bg-black text-white rounded-2xl font-semibold active:opacity-80"
                            >
                                Save Progress
                            </button>
                            <button
                                onClick={handleFinishWithoutSaving}
                                className="w-full py-3 bg-gray-100 rounded-2xl font-semibold text-gray-700 active:bg-gray-200"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </Page>
    );
}