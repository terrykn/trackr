import { useState, useMemo } from 'react';
import { Button, Page } from "konsta/react";
import { WeekView, WeekViewHeader, DayView, DayViewHeader } from '../components/Calendar';
import BottomNav from '../components/BottomNav';
import { Calendar1, CalendarDays, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns'; // Added import

type ViewMode = 'day' | 'week';

export default function HomePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const navigate = useNavigate();

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'day' ? 'week' : 'day');
    };

    const ViewModeIcon = useMemo(() => {
        return viewMode === 'day'
            ? <CalendarDays size={20} strokeWidth={2} />
            : <Calendar1 size={20} strokeWidth={2} />;
    }, [viewMode]);

    return (
        <Page className="flex flex-col h-screen theme-bg-base">
            {/* Custom flat header with Centered Month */}
            <div className="relative flex items-center justify-between px-4 py-3 theme-bg-base">
                {/* Left: View Mode Toggle */}
                <div className="flex-1 flex justify-start">
                    <Button
                        className="w-10 h-10 rounded-full theme-bg-secondary theme-border-mute border theme-text-gray"
                        onClick={toggleViewMode}
                    >
                        {ViewModeIcon}
                    </Button>
                </div>

                {/* Center: Month & Year */}
                <div className="flex-none">
                    <span className="text-lg font-bold tracking-wide theme-text-base">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                </div>

                {/* Right: Add Button */}
                <div className="flex-1 flex justify-end">
                    <Button
                        onClick={() => navigate('/create')}
                        className="w-10 h-10 rounded-full theme-bg-secondary theme-border-mute border theme-text-gray"
                    >
                        <Plus size={20} strokeWidth={2} />
                    </Button>
                </div>
            </div>

            <div className="flex-none z-10 theme-bg-base">
                {viewMode === 'day' ? (
                    <DayViewHeader currentDate={currentDate} onDateChange={setCurrentDate} />
                ) : (
                    <WeekViewHeader currentDate={currentDate} onDateChange={setCurrentDate} />
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-hidden relative theme-bg-base">
                {viewMode === 'day' ? (
                    <DayView currentDate={currentDate} />
                ) : (
                    <WeekView currentDate={currentDate} />
                )}
            </div>

            <BottomNav />
        </Page>
    );
}