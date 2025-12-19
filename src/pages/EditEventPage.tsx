import React, { useState, useEffect } from 'react';
import { Page, Navbar, List, ListInput, Block, Button, Sheet, Segmented, SegmentedButton } from 'konsta/react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Trash2, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getEventById, saveEvent, deleteEventAll, deleteEventInstance, deleteEventFuture, PALE_COLORS } from '../utils';
import type { HabitEvent, RepeatFrequency } from '../utils';

// --- UTILITY COMPONENT FOR DYNAMIC ICON RENDERING ---
const EventIcon = ({ name, size = 32 }: { name: string, size?: number }) => {
    const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;
    return Icon ? <Icon size={size} strokeWidth={2} /> : null;
};
// ---------------------------------------------------------------------------------------------

// --- CONSTANTS ---
const HabitIcons = [
    'Droplet', 'Walk', 'BookOpen', 'Dumbbell', 'Sun', 'Moon', 'Zap', 'Flame',
    'Leaf', 'Coffee', 'Heart', 'Feather', 'Briefcase', 'DollarSign',
    'Bed', 'Utensils', 'Meditation', 'Cloud', 'Sparkles', 'Music'
] as const;

// Preset units organized by category
const UNIT_PRESETS = {
    'Time': ['minutes', 'hours', 'seconds'],
    'Count': ['times', 'reps', 'sets', 'sessions'],
    'Reading': ['pages', 'chapters', 'books'],
    'Hydration': ['glasses', 'cups', 'liters', 'ml', 'oz'],
    'Distance': ['steps', 'miles', 'km', 'meters'],
    'Health': ['calories', 'mg', 'servings'],
};

type RecurrenceEndType = 'never' | 'on_date' | 'none';
const NEVER_END_DATE_ISO = new Date(2100, 0, 1).toISOString().split('T')[0];
const NEVER_END_DATE = new Date(2100, 0, 1).toISOString();

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export default function EditEventPage() {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    const location = useLocation();

    // Parse the date from the query parameter
    const queryParams = new URLSearchParams(location.search);
    const instanceDate = queryParams.get('date'); // YYYY-MM-DD of the clicked instance

    // --- SHEET STATES ---
    const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
    const [isIconSheetOpen, setIsIconSheetOpen] = useState(false);
    const [isUnitSheetOpen, setIsUnitSheetOpen] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);

    // --- FORM STATE ---
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Droplet');
    const [color, setColor] = useState(PALE_COLORS[0]);

    const [goalAmount, setGoalAmount] = useState('5');
    const [goalUnit, setGoalUnit] = useState('cups');

    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00');

    const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [repeatEvery, setRepeatEvery] = useState('1');
    const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>('week');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const [recurrenceEndType, setRecurrenceEndType] = useState<RecurrenceEndType>('never');
    const [endDateInput, setEndDateInput] = useState(addDays(new Date(), 7).toISOString().split('T')[0]);

    const [isLoaded, setIsLoaded] = useState(false);
    const [habitFound, setHabitFound] = useState(false);

    // --- LOAD HABIT DATA ON MOUNT ---
    useEffect(() => {
        if (!eventId) {
            navigate('/');
            return;
        }

        const event = getEventById(eventId);

        if (event) {
            setHabitFound(true);

            // 1. Core Details
            setName(event.name);
            setIcon(event.icon);
            setColor(event.color);
            setGoalAmount(event.goalAmount.toString());
            setGoalUnit(event.goalUnit);
            setStartTime(event.startTime);
            setEndTime(event.endTime);
            setStartDate(event.startDate.split('T')[0]);

            // Determine if it's recurring
            const isHabitRecurring = event.repeatFrequency !== 'day' || event.repeatEvery !== 1 || event.repeatDays.length > 0;
            setIsRecurring(isHabitRecurring);

            // 2. Recurrence Logic
            setRepeatDays(event.repeatDays);
            setRepeatEvery(event.repeatEvery.toString());
            setRepeatFrequency(event.repeatFrequency);

            // 3. End Date Logic
            const isoEndDate = event.endDate ? event.endDate.split('T')[0] : '';

            if (!isHabitRecurring) {
                setRecurrenceEndType('none');
            } else if (!event.endDate || isoEndDate === NEVER_END_DATE_ISO) {
                setRecurrenceEndType('never');
            } else {
                setRecurrenceEndType('on_date');
                setEndDateInput(isoEndDate);
            }
        } else {
            setHabitFound(false);
        }

        setIsLoaded(true);
    }, [eventId, navigate]);


    const toggleDay = (i: number) => {
        setRepeatDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort());
    };

    const handleSave = () => {
        if (!name || name.trim().length === 0) {
            alert('Please enter a name for your habit before saving.');
            return;
        }

        let finalEndDate: string | undefined;

        const isSingleDay = recurrenceEndType === 'none';

        if (recurrenceEndType === 'never') {
            finalEndDate = NEVER_END_DATE;
        } else if (recurrenceEndType === 'on_date') {
            finalEndDate = new Date(endDateInput).toISOString();
        } else if (isSingleDay) {
            finalEndDate = new Date(startDate).toISOString();
        }

        const idToSave = eventId!;

        saveEvent({
            id: idToSave,
            name: name.trim(),
            icon, color,
            goalAmount: parseInt(goalAmount) || 0, goalUnit,
            startTime, endTime,
            repeatDays: isSingleDay ? [] : repeatDays,
            repeatEvery: isSingleDay ? 1 : (parseInt(repeatEvery) || 1),
            repeatFrequency: isSingleDay ? 'day' as RepeatFrequency : repeatFrequency,
            startDate: new Date(startDate).toISOString(),
            endDate: finalEndDate,
        } as HabitEvent);

        navigate('/');
    };

    /**
     * Centralized handler for all delete types
     */
    const handleMainDelete = (action: 'instance' | 'future' | 'all') => {
        if (!eventId) return;

        if (action === 'all') {
            deleteEventAll(eventId);
        } else if (action === 'instance') {
            if (!instanceDate) {
                console.error("Cannot delete instance, no date provided.");
                alert("Error: Cannot delete this specific instance. Please try deleting all.");
                return;
            }
            deleteEventInstance(eventId, instanceDate);
        } else if (action === 'future') {
            if (!instanceDate) {
                console.error("Cannot delete future, no date provided.");
                alert("Error: Cannot delete future instances. Please try deleting all.");
                return;
            }
            deleteEventFuture(eventId, instanceDate);
        }

        setIsDeleteSheetOpen(false);
        navigate('/');
    };

    if (!isLoaded) {
        return <Page><Block>Loading...</Block></Page>;
    }

    if (isLoaded && !habitFound) {
        return (
            <Page>
                <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-700 active:scale-95 active:bg-gray-50 transition-all"><ArrowLeft size={24} /></button>
                </div>
                <Block>Habit not found.</Block>
            </Page>
        );
    }

    return (
        <Page className="bg-white">
            <div className="flex items-center justify-between px-4 py-3 bg-white">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-700 active:scale-95 active:bg-gray-50 transition-all"><ArrowLeft size={24} /></button>
                <button onClick={() => setIsDeleteSheetOpen(true)} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-red-500 active:scale-95 active:bg-gray-50 transition-all"><Trash2 size={24} /></button>
            </div>

            <div className="px-4 pb-20 pt-4">
                {/* ICON AND COLOR SELECTION */}
                <div className="flex gap-4 justify-center mb-6">
                    <button
                        onClick={() => setIsIconSheetOpen(true)}
                        className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center hover:bg-gray-100"
                        style={{ backgroundColor: color }}
                    >
                        <EventIcon name={icon} size={32} />
                    </button>
                </div>
                <div className="flex justify-center gap-2 mb-6 flex-wrap px-4">
                    {PALE_COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-black scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                {/* NAME */}
                <List strongIos className="!m-0 !mb-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <ListInput label="Name" type="text" placeholder="Drink water" value={name} onChange={(e) => setName(e.target.value)} />
                </List>

                {/* GOAL AND UNIT */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <List strongIos className="!m-0 rounded-2xl bg-gray-50 border border-gray-100">
                        <ListInput label="Goal" type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
                    </List>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setIsUnitSheetOpen(true)}
                            className="w-full h-full px-4 py-2 text-left flex flex-col justify-center"
                        >
                            <span className="text-xs text-gray-500 mb-0.5">Unit</span>
                            <div className="flex items-center justify-between">
                                <span className="text-base">{goalUnit}</span>
                                <ChevronDown size={18} className="text-gray-400" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* TIME RANGE */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <List strongIos className="!m-0 rounded-2xl bg-gray-50 border border-gray-100">
                        <ListInput label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </List>
                    <List strongIos className="!m-0 rounded-2xl bg-gray-50 border border-gray-100">
                        <ListInput label="End" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </List>
                </div>

                <Block className="!px-0 !my-2">
                    {/* RECURRENCE TYPE */}
                    <div className="my-4">
                        <Segmented rounded strong>
                            <SegmentedButton
                                active={recurrenceEndType === 'none'}
                                onClick={() => setRecurrenceEndType('none')}
                            >
                                One Time
                            </SegmentedButton>
                            <SegmentedButton
                                active={recurrenceEndType !== 'none'}
                                onClick={() => setRecurrenceEndType('never')}
                            >
                                Recurring
                            </SegmentedButton>
                        </Segmented>
                    </div>

                    {/* RECURRENCE DETAILS (If Recurring) */}
                    {recurrenceEndType !== 'none' && (
                        <>
                            {/* WEEKLY/MONTHLY/YEARLY SEGMENTS */}
                            <div className="mb-4">
                                <Segmented rounded strong>
                                    <SegmentedButton active={repeatFrequency === 'week'} onClick={() => setRepeatFrequency('week')}>Weekly</SegmentedButton>
                                    <SegmentedButton active={repeatFrequency === 'month'} onClick={() => setRepeatFrequency('month')}>Monthly</SegmentedButton>
                                    <SegmentedButton active={repeatFrequency === 'year'} onClick={() => setRepeatFrequency('year')}>Yearly</SegmentedButton>
                                </Segmented>
                            </div>

                            {/* WEEKLY REPEAT DAYS */}
                            {repeatFrequency === 'week' && (
                                <div className="flex gap-1 justify-between mb-4">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                        <button key={i} onClick={() => toggleDay(i)}
                                            className={`w-14 h-10 rounded-xl text-sm font-bold transition-colors ${repeatDays.includes(i) ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* REPEAT EVERY INPUT */}
                            <div className="mb-4">
                                <List strongIos className="!m-0 rounded-2xl bg-gray-50 border border-gray-100">
                                    <ListInput
                                        label={`Repeat every (${repeatFrequency}s)`}
                                        type="number"
                                        min="1"
                                        value={repeatEvery}
                                        onChange={(e) => setRepeatEvery(e.target.value)}
                                    />
                                </List>
                            </div>

                            {/* ENDS SEGMENTS */}
                            <p className="text-sm text-gray-500 mb-2 font-medium ml-1 mt-4">Ends</p>
                            <div className="mb-4">
                                <Segmented rounded strong>
                                    <SegmentedButton active={recurrenceEndType === 'never'} onClick={() => setRecurrenceEndType('never')}>Never</SegmentedButton>
                                    <SegmentedButton active={recurrenceEndType === 'on_date'} onClick={() => setRecurrenceEndType('on_date')}>On Date</SegmentedButton>
                                </Segmented>
                            </div>

                            {/* START/END DATE INPUTS */}
                            <div className="flex flex-row gap-4">
                                <List
                                    strongIos
                                    className="!m-0 rounded-2xl bg-gray-50 border border-gray-100 flex-1"
                                >
                                    <ListInput label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </List>

                                {recurrenceEndType === 'on_date' && (
                                    <List
                                        strongIos
                                        className="!m-0 rounded-2xl bg-gray-50 border border-gray-100 flex-1"
                                    >
                                        <ListInput label="End Date" type="date" value={endDateInput} onChange={(e) => setEndDateInput(e.target.value)} min={startDate} />
                                    </List>
                                )}
                            </div>
                        </>
                    )}
                </Block>

                {/* SAVE BUTTON */}
                <div className="mt-8">
                    <Button large rounded className="bg-black text-white" onClick={handleSave}>Save Changes</Button>
                </div>
            </div>

            {/* ICON PICKER SHEET */}
            <Sheet opened={isIconSheetOpen} onBackdropClick={() => setIsIconSheetOpen(false)} className="pb-safe">
                <Block className="!mt-0 pt-4">
                    <p className="text-xl font-bold mb-4 text-center">Choose Icon</p>
                    <div className="grid grid-cols-5 gap-3">
                        {HabitIcons.map((iconName) => {
                            const I = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
                            return (
                                <button key={iconName} onClick={() => { setIcon(iconName); setIsIconSheetOpen(false); }}
                                    className="w-full aspect-square rounded-xl flex items-center justify-center bg-gray-50 hover:bg-gray-200">
                                    {I ? <I size={24} /> : null}
                                </button>
                            )
                        })}
                    </div>
                    <Button large onClick={() => setIsIconSheetOpen(false)} className="mt-4">
                        Close
                    </Button>
                </Block>
            </Sheet>

            {/* UNIT PICKER SHEET */}
            <Sheet opened={isUnitSheetOpen} onBackdropClick={() => setIsUnitSheetOpen(false)} className="pb-safe">
                <Block className="!mt-0 pt-4 max-h-[70vh] overflow-y-auto">
                    <p className="text-xl font-bold mb-4 text-center">Choose Unit</p>
                    {Object.entries(UNIT_PRESETS).map(([category, units]) => (
                        <div key={category} className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{category}</p>
                            <div className="flex flex-wrap gap-2">
                                {units.map((unit) => (
                                    <button
                                        key={unit}
                                        onClick={() => { setGoalUnit(unit); setIsUnitSheetOpen(false); }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${goalUnit === unit
                                                ? 'bg-black text-white'
                                                : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                                            }`}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <Button large onClick={() => setIsUnitSheetOpen(false)} className="mt-4">
                        Close
                    </Button>
                </Block>
            </Sheet>

            {/* DELETE CONFIRMATION SHEET */}
            <Sheet opened={isDeleteSheetOpen} onBackdropClick={() => setIsDeleteSheetOpen(false)} className="pb-safe">
                <Block className="!mt-0 pt-8 pb-4">
                    <p className="text-xl font-bold mb-6 text-center">Delete Habit</p>

                    {isRecurring && instanceDate && (
                        <>
                            <Button
                                large
                                rounded
                                className="mb-3 bg-red-100 text-red-600 border border-red-300"
                                onClick={() => handleMainDelete('instance')}
                            >
                                Delete this only
                            </Button>

                            <Button
                                large
                                rounded
                                className="mb-3 bg-red-100 text-red-600 border border-red-300"
                                onClick={() => handleMainDelete('future')}
                            >
                                Delete this and all following
                            </Button>
                        </>
                    )}

                    <Button
                        large
                        rounded
                        className={`text-white ${isRecurring && instanceDate ? 'bg-red-500/80 mt-2' : 'bg-red-500'}`}
                        onClick={() => handleMainDelete('all')}
                    >
                        Delete all
                    </Button>

                    <Button
                        large
                        rounded
                        className="mt-3 bg-gray-300 text-black"
                        onClick={() => setIsDeleteSheetOpen(false)}
                    >
                        Cancel
                    </Button>
                </Block>
            </Sheet>
        </Page>
    );
}