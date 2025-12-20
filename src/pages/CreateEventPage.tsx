import React, { useState, useMemo } from 'react';
import { Page, List, ListInput, Block, Button, Sheet, Segmented, SegmentedButton } from 'konsta/react';
import { useNavigate } from 'react-router';
import * as LucideIcons from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { saveEvent, PALE_COLORS } from '../utils';
import type { HabitEvent, RepeatFrequency } from '../utils';

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

  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [repeatEvery, setRepeatEvery] = useState('1');
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>('week');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [recurrenceEndType, setRecurrenceEndType] = useState<RecurrenceEndType>('never');
  const [endDateInput, setEndDateInput] = useState(addDays(new Date(), 7).toISOString().split('T')[0]);


  const SelectedIcon = useMemo(() => {
    const I = LucideIcons[icon as keyof typeof LucideIcons] as React.ElementType;
    return I ? <I size={32} /> : null;
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
      finalEndDate = new Date(endDateInput).toISOString();
    } else if (recurrenceEndType === 'none') {
      finalEndDate = new Date(startDate).toISOString();
    }

    const isSingleDay = recurrenceEndType === 'none';
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

    saveEvent({
      id: newId,
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

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  return (
    <Page className="theme-bg-base">
      <div className="px-4 pb-20 pt-8">
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => setIsIconSheetOpen(true)}
            className="w-20 h-20 rounded-2xl border theme-border flex items-center justify-center transition-transform hover:scale-105"
            style={{ backgroundColor: color }}
          >
            {SelectedIcon}
          </button>
        </div>

        <div className="flex justify-center gap-2 mb-6 flex-wrap px-4">
          {PALE_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border transition-transform theme-border ${color === c ? 'scale-110 !border-2' : 'border-opacity-30'
                }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <List strongIos className="!m-0 !mb-4 rounded-2xl theme-bg-card border theme-border">
          <ListInput
            label="Name"
            type="text"
            placeholder="Drink water"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="theme-text-base"
          />
        </List>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <List strongIos className="!m-0 rounded-2xl theme-bg-card border theme-border">
            <ListInput
              label="Goal"
              type="number"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              className="theme-text-base"
            />
          </List>
          <div className="rounded-2xl theme-bg-card border theme-border overflow-hidden">
            <button
              onClick={() => setIsUnitSheetOpen(true)}
              className="w-full h-full px-4 py-2 text-left flex flex-col justify-center"
            >
              <span className="text-xs theme-text-muted mb-0.5">Unit</span>
              <div className="flex items-center justify-between">
                <span className="text-base theme-text-base">{goalUnit}</span>
                <ChevronDown size={18} className="theme-text-muted" />
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <List strongIos className="!m-0 rounded-2xl theme-bg-card border theme-border">
            <ListInput
              label="Start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="theme-text-base"
            />
          </List>
          <List strongIos className="!m-0 rounded-2xl theme-bg-card border theme-border">
            <ListInput
              label="End"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="theme-text-base"
            />
          </List>
        </div>

        <Block className="!px-0 !my-2">
          <div className="my-4">
            <Segmented rounded strong className="theme-bg-card border theme-border">
              <SegmentedButton
                active={recurrenceEndType === 'none'}
                onClick={() => setRecurrenceEndType('none')}
                className={recurrenceEndType === 'none' ? 'theme-bg-gray !text-white' : 'theme-text-base'}
              >
                One Time
              </SegmentedButton>
              <SegmentedButton
                active={recurrenceEndType !== 'none'}
                onClick={() => setRecurrenceEndType('never')}
                className={recurrenceEndType !== 'none' ? 'theme-bg-gray !text-white' : 'theme-text-base'}
              >
                Recurring
              </SegmentedButton>
            </Segmented>
          </div>

          {recurrenceEndType !== 'none' && (
            <>
              <div className="mb-4">
                <Segmented rounded strong className="theme-bg-card border theme-border">
                  <SegmentedButton
                    active={repeatFrequency === 'week'}
                    onClick={() => setRepeatFrequency('week')}
                    className={repeatFrequency === 'week' ? 'theme-bg-gray !text-white' : 'theme-text-base'}
                  >
                    Weekly
                  </SegmentedButton>
                  <SegmentedButton
                    active={repeatFrequency === 'month'}
                    onClick={() => setRepeatFrequency('month')}
                    className={repeatFrequency === 'month' ? 'theme-bg-gray !text-white' : 'theme-text-base'}
                  >
                    Monthly
                  </SegmentedButton>
                  <SegmentedButton
                    active={repeatFrequency === 'year'}
                    onClick={() => setRepeatFrequency('year')}
                    className={repeatFrequency === 'year' ? 'theme-bg-gray !text-white' : 'theme-text-base'}
                  >
                    Yearly
                  </SegmentedButton>
                </Segmented>
              </div>

              {repeatFrequency === 'week' && (
                <div className="flex gap-1 justify-between mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`w-14 h-10 rounded-xl text-sm font-bold transition-colors border ${repeatDays.includes(i)
                          ? 'theme-bg-gray text-white theme-border'
                          : 'theme-bg-card theme-text-muted theme-border'
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <List strongIos className="!m-0 rounded-2xl theme-bg-card border theme-border">
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

              <p className="text-sm theme-text-muted mb-2 font-medium ml-1 mt-4">Ends</p>
              <div className="mb-4">
                <Segmented rounded strong className="theme-bg-card border theme-border">
                  <SegmentedButton
                    active={recurrenceEndType === 'never'}
                    onClick={() => setRecurrenceEndType('never')}
                    className={recurrenceEndType === 'never' ? 'theme-bg-gray !text-white' : 'theme-text-base'}
                  >
                    Never
                  </SegmentedButton>
                  <SegmentedButton
                    active={recurrenceEndType === 'on_date'}
                    onClick={() => setRecurrenceEndType('on_date')}
                    className={recurrenceEndType === 'on_date' ? 'theme-bg-gray !text-white' : 'theme-text-base'}
                  >
                    On Date
                  </SegmentedButton>
                </Segmented>
              </div>

              <div className="flex flex-row gap-4">
                <List
                  strongIos
                  className="!m-0 rounded-2xl theme-bg-card border theme-border flex-1"
                >
                  <ListInput
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="theme-text-base"
                  />
                </List>

                {recurrenceEndType === 'on_date' && (
                  <List
                    strongIos
                    className="!m-0 rounded-2xl theme-bg-card border theme-border flex-1"
                  >
                    <ListInput
                      label="End Date"
                      type="date"
                      value={endDateInput}
                      onChange={(e) => setEndDateInput(e.target.value)}
                      className="theme-text-base"
                    />
                  </List>
                )}
              </div>
            </>
          )}
        </Block>

        <div className="mt-8 flex flex-row gap-4">
          <Button
            large
            rounded
            className="theme-bg-secondary theme-text-gray font-bold"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            large
            rounded
            className="theme-bg-primary theme-text-gray border theme-border font-bold"
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
        <Block className="!mt-0 pt-4">
          <p className="text-xl font-bold mb-4 text-center theme-text-base">Choose Icon</p>
          <div className="gri

d grid-cols-5 gap-3">
            {HabitIcons.map((iconName) => {
              const I = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
              return (
                <button
                  key={iconName}
                  onClick={() => { setIcon(iconName); setIsIconSheetOpen(false); }}
                  className="w-full aspect-square rounded-xl flex items-center justify-center theme-bg-card border theme-border hover:theme-bg-secondary transition-colors theme-text-base"
                >
                  {I ? <I size={24} /> : null}
                </button>
              )
            })}
          </div>
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
            <div key={category} className="mb-4">
              <p className="text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2 px-1">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {units.map((unit) => (
                  <button
                    key={unit}
                    onClick={() => { setGoalUnit(unit); setIsUnitSheetOpen(false); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border theme-border ${goalUnit === unit
                        ? 'theme-bg-gray text-white'
                        : 'theme-bg-card theme-text-base active:theme-bg-secondary'
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
            onClick={() => setIsUnitSheetOpen(false)}
            className="mt-4 theme-bg-card theme-text-base border theme-border"
          >
            Close
          </Button>
        </Block>
      </Sheet>
    </Page>
  );
}