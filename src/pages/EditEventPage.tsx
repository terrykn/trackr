import React, { useState, useEffect } from 'react';
import { Page, Navbar, List, ListInput, Block, Button, Sheet, Segmented, SegmentedButton, Toolbar } from 'konsta/react';
import { useParams, useNavigate } from 'react-router'; // Use 'react-router-dom' for consistency
import { ArrowLeft, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getEventById, saveEvent, deleteEvent, PALE_COLORS } from '../utils';
import type { HabitEvent, RepeatFrequency } from '../utils';

// --- UTILITY COMPONENT FOR DYNAMIC ICON RENDERING ---
const EventIcon = ({ name, size = 32 }: { name: string, size?: number }) => {
    const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;
    // Set strokeWidth=2 for consistency with the EditEventPage's original Icon usage
    return Icon ? <Icon size={size} strokeWidth={2} /> : null;
};
// ---------------------------------------------------------------------------------------------

// --- CONSTANTS ---
const HabitIcons = [
    'Droplet', 'Walk', 'BookOpen', 'Dumbbell', 'Sun', 'Moon', 'Zap', 'Flame',
    'Leaf', 'Coffee', 'Heart', 'Feather', 'Briefcase', 'DollarSign',
    'Bed', 'Utensils', 'Meditation', 'Cloud', 'Sparkles', 'Music'
] as const;

type RecurrenceEndType = 'never' | 'on_date' | 'none';
const NEVER_END_DATE_ISO = new Date(2100, 0, 1).toISOString().split('T')[0];
const NEVER_END_DATE = new Date(2100, 0, 1).toISOString(); // Needed for save function

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export default function EditEventPage() {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();

    // --- FORM STATE ---
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Droplet');
    const [color, setColor] = useState(PALE_COLORS[0]);
    const [isIconSheetOpen, setIsIconSheetOpen] = useState(false);

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

            // 2. Recurrence Logic
            setRepeatDays(event.repeatDays);
            setRepeatEvery(event.repeatEvery.toString());
            setRepeatFrequency(event.repeatFrequency);

            // 3. End Date Logic
            const isoEndDate = event.endDate ? event.endDate.split('T')[0] : '';
            // const isoStartDate = event.startDate.split('T')[0]; // Not directly used for logic below

            if (event.repeatFrequency === 'day' && event.repeatEvery === 1 && event.repeatDays.length === 0) {
                // One-time event
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
            // Adjust payload based on one-time vs recurring
            repeatDays: isSingleDay ? [] : repeatDays,
            repeatEvery: isSingleDay ? 1 : (parseInt(repeatEvery) || 1),
            repeatFrequency: isSingleDay ? 'day' as RepeatFrequency : repeatFrequency,
            startDate: new Date(startDate).toISOString(),
            endDate: finalEndDate,
        } as HabitEvent);

        navigate('/');
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this habit? This cannot be undone.")) {
            if (eventId) {
                deleteEvent(eventId);
                navigate('/');
            }
        }
    };

    if (!isLoaded) {
        return <Page><Block>Loading...</Block></Page>;
    }

    if (isLoaded && !habitFound) {
        return (
            <Page>
                <Navbar
                    title="Error"
                    left={<button onClick={() => navigate(-1)} className="p-2 text-black"><ArrowLeft size={24} /></button>}
                />
                <Block>Habit not found.</Block>
            </Page>
        );
    }

    return (
        <Page className="bg-white">
            <Navbar
                title="Edit Habit"
                left={<button onClick={() => navigate(-1)} className="p-2 text-black"><ArrowLeft size={24} /></button>}
                right={<button onClick={handleDelete} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={24} /></button>}
                transparent
            />

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

                {/* NAME AND GOAL */}
                <List strongIos className="!m-0 !mb-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <ListInput label="Name" type="text" placeholder="Drink water" value={name} onChange={(e) => setName(e.target.value)} />
                </List>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <List strongIos className="!m-0 rounded-2xl bg-gray-50 border border-gray-100">
                        <ListInput label="Goal" type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
                    </List>
                    <List strongIos className="!m-0 rounded-2xl bg-gray-50 border border-gray-100">
                        <ListInput label="Unit" type="text" value={goalUnit} onChange={(e) => setGoalUnit(e.target.value)} />
                    </List>
                </div>

                {/* TIME RANGE (USING CREATE STYLE) */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <List strongIos className="!m-0 rounded-2xl bg-gray-50 border border-gray-100">
                        <ListInput label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </List>
                    <List strongIos className="!m-0 rounded-2xl bg-gray-50 border border-gray-100">
                        <ListInput label="End" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </List>
                </div>

                <Block className="!px-0 !my-2">
                    {/* RECURRENCE TYPE (ONE-TIME / RECURRING) */}
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

                {/* SAVE BUTTON (USING CREATE STYLE) */}
                <div className="mt-8">
                    <Button large rounded className="bg-black text-white" onClick={handleSave}>Save Changes</Button>
                </div>
            </div>

            {/* ICON PICKER SHEET (Identical to previous implementation) */}
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
        </Page>
    );
}