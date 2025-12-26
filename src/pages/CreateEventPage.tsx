import React, { useState, useMemo } from 'react';
import { Page, List, ListInput, Block, Button, Sheet, Segmented, SegmentedButton, Navbar, NavbarBackLink } from 'konsta/react';
import { useNavigate } from 'react-router';
import * as LucideIcons from 'lucide-react';
import { ChevronDown, Pencil } from 'lucide-react';
import { saveEvent, PALE_COLORS } from '../utils';
import type { HabitEvent, RepeatFrequency } from '../utils';

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

const NEVER_END_DATE = new Date(2100, 0, 1).toISOString();

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Droplet');
  const [color, setColor] = useState(PALE_COLORS[0]);
  const [isIconSheetOpen, setIsIconSheetOpen] = useState(false);
  const [isUnitSheetOpen, setIsUnitSheetOpen] = useState(false);

  const [goalAmount, setGoalAmount] = useState('5');
  const [goalUnit, setGoalUnit] = useState('cups');

  const [isAllDay, setIsAllDay] = useState(true); // New state for all-day toggle
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [repeatEvery, setRepeatEvery] = useState('1');
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>('week');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [recurrenceEndType, setRecurrenceEndType] = useState<RecurrenceEndType>('none');
  const [endDateInput, setEndDateInput] = useState(addDays(new Date(), 7).toISOString().split('T')[0]);


  const SelectedIcon = useMemo(() => {
    const I = LucideIcons[icon as keyof typeof LucideIcons] as React.ElementType;
    return I ? <I size={36} strokeWidth={1.5} /> : null;
  }, [icon]);

  const toggleDay = (i: number) => {
    setRepeatDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort());
  };

  const handleSave = () => {
    if (!name || name.trim().length === 0) {
      alert('Please enter a name for your habit before creating it.');
      return;
    }

    let finalEndDate: string | undefined;

    if (recurrenceEndType === 'never') {
      finalEndDate = NEVER_END_DATE;
    } else if (recurrenceEndType === 'on_date') {
      // Save as date string without time
      finalEndDate = endDateInput; // This is already in YYYY-MM-DD format
    } else if (recurrenceEndType === 'none') {
      // For one-time events, end date should be the same as start date
      finalEndDate = startDate; // This is already in YYYY-MM-DD format
    }

    const isSingleDay = recurrenceEndType === 'none';
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

    const habitEvent: HabitEvent = {
      id: newId,
      name: name.trim(),
      icon,
      color,
      goalAmount: parseInt(goalAmount) || 0,
      goalUnit,
      isAllDay,
      repeatDays: isSingleDay ? [] : repeatDays,
      repeatEvery: isSingleDay ? 1 : (parseInt(repeatEvery) || 1),
      repeatFrequency: isSingleDay ? 'day' as RepeatFrequency : repeatFrequency,
      startDate: startDate, // Already in YYYY-MM-DD format
      endDate: finalEndDate,
    };

    // Only add time fields if not all-day
    if (!isAllDay) {
      habitEvent.startTime = startTime;
      habitEvent.endTime = endTime;
    }

    saveEvent(habitEvent);
    navigate('/');
  };

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  return (
    <Page className="theme-bg-base">
      <Navbar
        title="Create Event"
        left={<NavbarBackLink onClick={() => navigate(-1)} />}
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
            {/* Pencil badge */}
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
              className={`w-8 h-8 rounded-full transition-transform event-card-shadow ${color === c ? 'scale-115 ring-2 ring-offset-2 ring-gray-400' : ''
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

        {/* Time inputs - only shown when not all-day */}
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
                    className={`!flex-1 !h-10 !rounded-2xl text-sm font-bold transition-colors ${repeatDays.includes(i)
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
            onClick={handleSave}
          >
            Create
          </Button>
        </div>
      </div>

      {/* Icon Picker Sheet */}
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
                        className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-colors ${isSelected
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

      {/* Unit Picker Sheet */}
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
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${goalUnit === unit
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
    </Page>
  );
}
