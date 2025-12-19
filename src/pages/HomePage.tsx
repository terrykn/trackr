import { useState, useMemo } from 'react';
import { Page } from "konsta/react";
import { WeekView, WeekViewHeader, DayView, DayViewHeader } from '../components/Calendar';
import BottomNav from '../components/BottomNav';
import { Calendar1, CalendarDays, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';

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
            ? <CalendarDays size={20} strokeWidth={1.5} />
            : <Calendar1 size={20} strokeWidth={1.5} />;
    }, [viewMode]);

    return (
        <Page className="flex flex-col h-screen bg-white">
            {/* Custom flat header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white">
                <button
                    onClick={toggleViewMode}
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-700 active:scale-95 active:bg-gray-50 transition-all"
                >
                    {ViewModeIcon}
                </button>
                <button
                    onClick={() => navigate('/create')}
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-700 active:scale-95 active:bg-gray-50 transition-all"
                >
                    <Plus size={20} strokeWidth={1.5} />
                </button>
            </div>

            <div className="flex-none z-10 bg-white">
                {viewMode === 'day' ? (
                    <DayViewHeader currentDate={currentDate} onDateChange={setCurrentDate} />
                ) : (
                    <WeekViewHeader currentDate={currentDate} onDateChange={setCurrentDate} />
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-hidden relative bg-white">
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