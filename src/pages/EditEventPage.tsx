import React, { useState, useEffect, useMemo } from 'react';
import { Page, List, ListInput, Block, Button, Sheet, Segmented, SegmentedButton, Navbar, NavbarBackLink } from 'konsta/react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { Trash2, ChevronDown, Pencil } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { 
    getEventById, 
    saveEvent, 
    deleteEventAll, 
    deleteEventInstance, 
    deleteEventFuture, 
    saveException,
    getExceptionForDate,
    createFollowingEvent,
    PALE_COLORS 
} from '../utils';
import type { HabitEvent, RepeatFrequency } from '../utils';

// Icons organized by category
const ICON_CATEGORIES = {
    'HEALTH & FITNESS': [
        'Dumbbell', 'Heart', 'Droplet', 'Apple', 'Pill', 'Activity', 'Footprints', 'Bike', 'PersonStanding', 'Salad'
    ],
    'PRODUCTIVITY': [
        'CheckSquare', 'Clock', 'Target', 'Calendar', 'ListTodo', 'Timer', 'Zap', 'Trophy', 'Flag', 'Bookmark'
    ],
    'HOME': [
        'Home', 'Bed', 'Utensils', 'ShowerHead', 'Sofa', 'Lamp', 'Key', 'DoorOpen', 'Flower2', 'Dog'
    ],
    'FINANCE': [
        'DollarSign', 'Wallet', 'CreditCard', 'PiggyBank', 'TrendingUp', 'Receipt', 'Coins', 'Banknote', 'Calculator', 'Briefcase'
    ],
    'HOBBIES': [
        'Gamepad2', 'Mountain', 'Tent', 'Fish', 'Camera', 'Bike', 'Plane', 'Map', 'Compass', 'Anchor'
    ],
    'CREATIVE': [
        'Palette', 'Brush', 'PenTool', 'Music', 'Mic', 'Film', 'BookOpen', 'Feather', 'Sparkles', 'Lightbulb'
    ],
    'SOCIAL': [
        'Users', 'MessageCircle', 'Phone', 'Mail', 'Heart', 'Gift', 'PartyPopper', 'Handshake', 'UserPlus', 'Share2'
    ],
};

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

    const queryParams = new URLSearchParams(location.search);
    const instanceDate = queryParams.get('date');

    // --- SHEET STATES ---
    const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isIconSheetOpen, setIsIconSheetOpen] = useState(false);
    const [isUnitSheetOpen, setIsUnitSheetOpen] = useState(false);

    // --- FORM STATE ---
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Droplet');
    const [color, setColor] = useState(PALE_COLORS[0]);

    const [goalAmount, setGoalAmount] = useState('5');
    const [goalUnit, setGoalUnit] = useState('cups');

    const [isAllDay, setIsAllDay] = useState(true);
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
    const [originalEvent, setOriginalEvent] = useState<HabitEvent | null>(null);

    const SelectedIcon = useMemo(() => {
        const I = LucideIcons[icon as keyof typeof LucideIcons] as React.ElementType;
        return I ? <I size={36} strokeWidth={1.5} /> : null;
    }, [icon]);

    // Determine if this is a recurring event
    const isRecurring = useMemo(() => {
        return recurrenceEndType !== 'none';
    }, [recurrenceEndType]);

    // --- LOAD HABIT DATA ON MOUNT ---
    useEffect(() => {
        if (!eventId) {
            navigate('/');
            return;
        }

        const event = getEventById(eventId);

        if (event) {
            setHabitFound(true);
            setOriginalEvent(event);

            // Check if there's an exception for this specific date
            let displayEvent = event;
            if (instanceDate) {
                const exception = getExceptionForDate(eventId, instanceDate);
                if (exception) {
                    displayEvent = { ...event, ...exception.modifiedFields };
                }
            }

            // Load all fields
            setName(displayEvent.name);
            setIcon(displayEvent.icon);
            setColor(displayEvent.color);
            setGoalAmount(displayEvent.goalAmount.toString());
            setGoalUnit(displayEvent.goalUnit);
            setIsAllDay(displayEvent.isAllDay);
            
            if (!displayEvent.isAllDay) {
                setStartTime(displayEvent.startTime || '08:00');
                setEndTime(displayEvent.endTime || '09:00');
            }
            
            setStartDate(displayEvent.startDate.split('T')[0]);

            // Determine if it's recurring
            const isHabitRecurring = displayEvent.repeatFrequency !== 'day' || 
                                    displayEvent.repeatEvery !== 1 || 
                                    displayEvent.repeatDays.length > 0;

            setRepeatDays(displayEvent.repeatDays);
            setRepeatEvery(displayEvent.repeatEvery.toString());
            setRepeatFrequency(displayEvent.repeatFrequency);

            const isoEndDate = displayEvent.endDate ? displayEvent.endDate.split('T')[0] : '';

            if (!isHabitRecurring) {
                setRecurrenceEndType('none');
            } else if (!displayEvent.endDate || isoEndDate === NEVER_END_DATE_ISO) {
                setRecurrenceEndType('never');
            } else {
                setRecurrenceEndType('on_date');
                setEndDateInput(isoEndDate);
            }
        } else {
            setHabitFound(false);
        }

        setIsLoaded(true);
    }, [eventId, navigate, instanceDate]);

    const toggleDay = (i: number) => {
        setRepeatDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort());
    };

    /**
     * Opens the edit confirmation sheet for recurring events
     */
    const handleEditAttempt = () => {
        if (!name || name.trim().length === 0) {
            alert('Please enter a name for your habit before saving.');
            return;
        }

        if (isRecurring && instanceDate) {
            setIsEditSheetOpen(true);
        } else {
            handleSaveAll();
        }
    };

    /**
     * Save changes to a single instance (create exception)
     */
    const handleSaveInstance = () => {
        if (!eventId || !instanceDate) return;

        const modifiedFields: Partial<HabitEvent> = {
            name: name.trim(),
            icon,
            color,
            goalAmount: parseInt(goalAmount) || 0,
            goalUnit,
            isAllDay,
        };

        if (!isAllDay) {
            modifiedFields.startTime = startTime;
            modifiedFields.endTime = endTime;
        }

        saveException({
            eventId,
            date: instanceDate,
            modifiedFields,
        });

        setIsEditSheetOpen(false);
        navigate('/');
    };

    /**
     * Save changes to this instance and all following (create new master rule)
     */
    const handleSaveFollowing = () => {
        if (!eventId || !instanceDate || !originalEvent) return;

        let finalEndDate: string | undefined;
        const isSingleDay = recurrenceEndType === 'none';

        if (recurrenceEndType === 'never') {
            finalEndDate = NEVER_END_DATE;
        } else if (recurrenceEndType === 'on_date') {
            finalEndDate = endDateInput;
        } else if (isSingleDay) {
            finalEndDate = startDate;
        }

        const updates: Partial<HabitEvent> = {
            name: name.trim(),
            icon,
            color,
            goalAmount: parseInt(goalAmount) || 0,
            goalUnit,
            isAllDay,
            repeatDays: isSingleDay ? [] : repeatDays,
            repeatEvery: isSingleDay ? 1 : (parseInt(repeatEvery) || 1),
            repeatFrequency: isSingleDay ? 'day' as RepeatFrequency : repeatFrequency,
            startDate: instanceDate,
            endDate: finalEndDate,
        };

        if (!isAllDay)  {
            updates.startTime = startTime;
            updates.endTime = endTime;
        }

        createFollowingEvent(originalEvent, instanceDate, updates);

        setIsEditSheetOpen(false);
        navigate('/');
    };

    /**
     * Save changes to all instances (modify master rule)
     */
    const handleSaveAll = () => {
        if (!eventId) return;

        let finalEndDate: string | undefined;
        const isSingleDay = recurrenceEndType === 'none';

        if (recurrenceEndType === 'never') {
            finalEndDate = NEVER_END_DATE;
        } else if (recurrenceEndType === 'on_date') {
            finalEndDate = endDateInput;
        } else if (isSingleDay) {
            finalEndDate = startDate;
        }

        const habitEvent: HabitEvent = {
            id: eventId,
            name: name.trim(),
            icon,
            color,
            goalAmount: parseInt(goalAmount) || 0,
            goalUnit,
            isAllDay,
            repeatDays: isSingleDay ? [] : repeatDays,
            repeatEvery: isSingleDay ? 1 : (parseInt(repeatEvery) || 1),
            repeatFrequency: isSingleDay ? 'day' as RepeatFrequency : repeatFrequency,
            startDate: startDate,
            endDate: finalEndDate,
        };

        if (!isAllDay) {
            habitEvent.startTime = startTime;
            habitEvent.endTime = endTime;
        }

        saveEvent(habitEvent);

        setIsEditSheetOpen(false);
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
        return <Page className="theme-bg-base"><Block>Loading...</Block></Page>;
    }

    if (isLoaded && !habitFound) {
        return (
            <Page className="theme-bg-base">
                <Navbar
                    title="Edit Event"
                    left={<NavbarBackLink onClick={() => navigate(-1)} />}
                />
                <Block>Habit not found.</Block>
            </Page>
        );
    }

    return (
        <Page className="theme-bg-base">
            <Navbar
                title="Edit Event"
                left={<NavbarBackLink onClick={() => navigate(-1)} />}
                right={
                    <button 
                        onClick={() => setIsDeleteSheetOpen(true)} 
                        className="p-2 text-red-600"
                    >
                        <Trash2 size={24} />
                    </button>
                }
            />

            <div className="px-screen pb-20 pt-4">
                {/* Icon with pencil edit badge */}
                <div className="flex gap-container justify-center mb-container">
                    <div className="relative">
                        <button
                            onClick={() => setIsIconSheetOpen(true)}
                            className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 event-card-shadow"
                            style={{ backgroundColor: color }}
                        >
                            {SelectedIcon}
                        </button>
                        <button
                            onClick={() => setIsIconSheetOpen(true)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full theme-bg-gray flex items-center justify-center"
                        >
                            <Pencil size={12} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-center gap-2 mb-container flex-wrap">
                    {PALE_COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full transition-transform event-card-shadow ${
                                color === c ? 'scale-115 ring-2 ring-offset-2 ring-gray-400' : ''
                            }`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="mb-container theme-bg-card rounded-2xl relative border theme-border overflow-hidden">
                    <List strongIos className="!m-0">
                        <ListInput
                            label="Name"
                            type="text"
                            placeholder="Drink water"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="theme-text-base"
                        />
                    </List>
                </div>

                <div className="grid grid-cols-2 gap-container mb-container">
                    <div className="theme-bg-card rounded-2xl relative border theme-border overflow-hidden">
                        <List strongIos className="!m-0">
                            <ListInput
                                label="Goal"
                                type="number"
                                value={goalAmount}
                                onChange={(e) => setGoalAmount(e.target.value)}
                                className="theme-text-base"
                            />
                        </List>
                    </div>
                    <div className="theme-bg-card rounded-2xl relative border theme-border overflow-hidden">
                        <button
                            onClick={() => setIsUnitSheetOpen(true)}
                            className="w-full h-full px-3 py-2 text-left flex flex-col justify-center"
                        >
                            <span className="text-xs theme-text-muted mb-0.5">Unit</span>
                            <div className="flex items-center justify-between">
                                <span className="text-base theme-text-base">{goalUnit}</span>
                                <ChevronDown size={18} className="theme-text-muted" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Time Type Selector */}
                <div className="mb-container">
                    <p className="text-sm theme-text-muted mb-2 font-medium">Time Settings</p>
                    <Segmented rounded strong className="theme-bg-card relative border theme-border">
                        <SegmentedButton
                            active={isAllDay}
                            onClick={() => setIsAllDay(true)}
                            className={isAllDay ? 'btn-primary' : 'theme-text-base'}
                        >
                            All Day
                        </SegmentedButton>
                        <SegmentedButton
                            active={!isAllDay}
                            onClick={() => setIsAllDay(false)}
                            className={!isAllDay ? 'btn-primary' : 'theme-text-base'}
                        >
                            Specific Time
                        </SegmentedButton>
                    </Segmented>
                </div>

                {!isAllDay && (
                    <div className="grid grid-cols-2 gap-container mb-container">
                        <div className="theme-bg-card rounded-2xl relative border theme-border overflow-hidden">
                            <List strongIos className="!m-0">
                                <ListInput
                                    label="Start"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="theme-text-base"
                                />
                            </List>
                        </div>
                        <div className="theme-bg-card rounded-2xl relative border theme-border overflow-hidden">
                            <List strongIos className="!m-0">
                                <ListInput
                                    label="End"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="theme-text-base"
                                />
                            </List>
                        </div>
                    </div>
                )}

                <div className="mb-container">
                    <p className="text-sm theme-text-muted mb-2 font-medium">Recurrence</p>
                    <Segmented rounded strong className="theme-bg-card relative border theme-border">
                        <SegmentedButton
                            active={recurrenceEndType === 'none'}
                            onClick={() => setRecurrenceEndType('none')}
                            className={recurrenceEndType === 'none' ? 'btn-primary' : 'theme-text-base'}
                        >
                            One Time
                        </SegmentedButton>
                        <SegmentedButton
                            active={recurrenceEndType !== 'none'}
                            onClick={() => setRecurrenceEndType('never')}
                            className={recurrenceEndType !== 'none' ? 'btn-primary' : 'theme-text-base'}
                        >
                            Recurring
                        </SegmentedButton>
                    </Segmented>
                </div>

                {recurrenceEndType !== 'none' && (
                    <>
                        <div className="mb-container">
                            <Segmented rounded strong className="theme-bg-card relative border theme-border">
                                <SegmentedButton
                                    active={repeatFrequency === 'week'}
                                    onClick={() => setRepeatFrequency('week')}
                                    className={repeatFrequency === 'week' ? 'btn-primary' : 'theme-text-base'}
                                >
                                    Weekly
                                </SegmentedButton>
                                <SegmentedButton
                                    active={repeatFrequency === 'month'}
                                    onClick={() => setRepeatFrequency('month')}
                                    className={repeatFrequency === 'month' ? 'btn-primary' : 'theme-text-base'}
                                >
                                    Monthly
                                </SegmentedButton>
                                <SegmentedButton
                                    active={repeatFrequency === 'year'}
                                    onClick={() => setRepeatFrequency('year')}
                                    className={repeatFrequency === 'year' ? 'btn-primary' : 'theme-text-base'}
                                >
                                    Yearly
                                </SegmentedButton>
                            </Segmented>
                        </div>

                        {repeatFrequency === 'week' && (
                            <div className="flex gap-1 justify-between mb-container">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <Button
                                        key={i}
                                        clear
                                        onClick={() => toggleDay(i)}
                                        className={`!flex-1 !h-10 !rounded-2xl text-sm font-bold transition-colors ${
                                            repeatDays.includes(i)
                                                ? 'btn-primary'
                                                : 'btn-secondary relative border theme-border'
                                        }`}
                                    >
                                        {d}
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="mb-container theme-bg-card rounded-2xl relative border theme-border overflow-hidden">
                            <List strongIos className="!m-0">
                                <ListInput
                                    label={`Repeat every (${repeatFrequency}s)`}
                                    type="number"
                                    min="1"
                                    value={repeatEvery}
                                    onChange={(e) => setRepeatEvery(e.target.value)}
                                    className="theme-text-base"
                                />
                            </List>
                        </div>

                        <p className="text-sm theme-text-muted mb-2 font-medium">Ends</p>
                        <div className="mb-container">
                            <Segmented rounded strong className="theme-bg-card relative border theme-border">
                                <SegmentedButton
                                    active={recurrenceEndType === 'never'}
                                    onClick={() => setRecurrenceEndType('never')}
                                    className={recurrenceEndType === 'never' ? 'btn-primary' : 'theme-text-base'}
                                >
                                    Never
                                </SegmentedButton>
                                <SegmentedButton
                                    active={recurrenceEndType === 'on_date'}
                                    onClick={() => setRecurrenceEndType('on_date')}
                                    className={recurrenceEndType === 'on_date' ? 'btn-primary' : 'theme-text-base'}
                                >
                                    On Date
                                </SegmentedButton>
                            </Segmented>
                        </div>

                        <div className="flex flex-row gap-container">
                            <div className="theme-bg-card rounded-2xl relative border theme-border overflow-hidden flex-1">
                                <List strongIos className="!m-0">
                                    <ListInput
                                        label="Start Date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="theme-text-base"
                                    />
                                </List>
                            </div>

                            {recurrenceEndType === 'on_date' && (
                                <div className="theme-bg-card rounded-2xl relative border theme-border overflow-hidden flex-1">
                                    <List strongIos className="!m-0">
                                        <ListInput
                                            label="End Date"
                                            type="date"
                                            value={endDateInput}
                                            onChange={(e) => setEndDateInput(e.target.value)}
                                            className="theme-text-base"
                                        />
                                    </List>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="mt-6 flex flex-row gap-container">
                    <Button
                        large
                        rounded
                        className="btn-secondary relative border theme-border"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                    <Button
                        large
                        rounded
                        className="btn-primary"
                        onClick={handleEditAttempt}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* ICON PICKER SHEET */}
            <Sheet
                opened={isIconSheetOpen}
                onBackdropClick={() => setIsIconSheetOpen(false)}
                className="pb-safe theme-bg-base"
            >
                <Block className="!mt-0 pt-4 max-h-[70vh] overflow-y-auto">
                    <p className="text-xl font-bold mb-4 text-center theme-text-base">Choose Icon</p>
                    
                    {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                        <div key={category} className="mb-container">
                            <p className="text-[10px] font-semibold theme-text-muted uppercase tracking-wider mb-2 px-1">
                                {category}
                            </p>
                            <div className="rounded-2xl theme-bg-card relative border theme-border p-2">
                                <div className="grid grid-cols-10 gap-1">
                                    {icons.map((iconName) => {
                                        const I = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
                                        const isSelected = icon === iconName;
                                        return (
                                            <button
                                                key={iconName}
                                                onClick={() => { setIcon(iconName); setIsIconSheetOpen(false); }}
                                                className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-colors ${
                                                    isSelected 
                                                        ? 'btn-primary' 
                                                        : 'hover:theme-bg-secondary theme-text-base'
                                                }`}
                                            >
                                                {I ? <I size={16} /> : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <Button
                        large
                        rounded
                        onClick={() => setIsIconSheetOpen(false)}
                        className="mt-4 btn-secondary relative border theme-border"
                    >
                        Close
                    </Button>
                </Block>
            </Sheet>

            {/* UNIT PICKER SHEET */}
            <Sheet
                opened={isUnitSheetOpen}
                onBackdropClick={() => setIsUnitSheetOpen(false)}
                className="pb-safe theme-bg-base"
            >
                <Block className="!mt-0 pt-4 max-h-[70vh] overflow-y-auto">
                    <p className="text-xl font-bold mb-4 text-center theme-text-base">Choose Unit</p>
                    {Object.entries(UNIT_PRESETS).map(([category, units]) => (
                        <div key={category} className="mb-container">
                            <p className="text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2 px-1">
                                {category}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {units.map((unit) => (
                                    <button
                                        key={unit}
                                        onClick={() => { setGoalUnit(unit); setIsUnitSheetOpen(false); }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                            goalUnit === unit
                                                ? 'btn-primary'
                                                : 'btn-secondary relative border theme-border active:theme-bg-secondary'
                                        }`}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <Button
                        large
                        rounded
                        onClick={() => setIsUnitSheetOpen(false)}
                        className="mt-4 btn-secondary relative border theme-border"
                    >
                        Close
                    </Button>
                </Block>
            </Sheet>

            {/* EDIT CONFIRMATION SHEET */}
            <Sheet opened={isEditSheetOpen} onBackdropClick={() => setIsEditSheetOpen(false)} className="pb-safe theme-bg-base">
                <Block className="!mt-0 pt-8 pb-4">
                    <p className="text-xl font-bold mb-6 text-center theme-text-base">Save Changes</p>

                    <Button
                        large
                        rounded
                        className="mb-3 btn-secondary relative border theme-border"
                        onClick={handleSaveInstance}
                    >
                        This event only
                    </Button>

                    <Button
                        large
                        rounded
                        className="mb-3 btn-secondary relative border theme-border"
                        onClick={handleSaveFollowing}
                    >
                        This and all following
                    </Button>

                    <Button
                        large
                        rounded
                        className="mb-3 btn-primary"
                        onClick={handleSaveAll}
                    >
                        All events
                    </Button>

                    <Button
                        large
                        rounded
                        className="mt-3 btn-secondary relative border theme-border"
                        onClick={() => setIsEditSheetOpen(false)}
                    >
                        Cancel
                    </Button>
                </Block>
            </Sheet>

            {/* DELETE CONFIRMATION SHEET */}
            <Sheet opened={isDeleteSheetOpen} onBackdropClick={() => setIsDeleteSheetOpen(false)} className="pb-safe theme-bg-base">
                <Block className="!mt-0 pt-8 pb-4">
                    <p className="text-xl font-bold mb-6 text-center theme-text-base">Delete Habit</p>

                    {isRecurring && instanceDate && (
                        <>
                            <Button
                                large
                                rounded
                                className="mb-3 bg-red-100 text-red-600 font-bold"
                                onClick={() => handleMainDelete('instance')}
                            >
                                Delete this only
                            </Button>

                            <Button
                                large
                                rounded
                                className="mb-3 bg-red-100 text-red-600 font-bold"
                                onClick={() => handleMainDelete('future')}
                            >
                                Delete this and all following
                            </Button>
                        </>
                    )}

                    <Button
                        large
                        rounded
                        className={`text-white font-bold ${isRecurring && instanceDate ? 'bg-red-500/80 mt-2' : 'bg-red-500'}`}
                        onClick={() => handleMainDelete('all')}
                    >
                        Delete all
                    </Button>

                    <Button
                        large
                        rounded
                        className="mt-3 btn-secondary relative border theme-border"
                        onClick={() => setIsDeleteSheetOpen(false)}
                    >
                        Cancel
                    </Button>
                </Block>
            </Sheet>
        </Page>
    );
}