import { useState, useMemo } from 'react';
import { Page, Navbar } from "konsta/react";
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
            ? <CalendarDays size={24} className="text-gray-800" />
            : <Calendar1 size={24} className="text-gray-800" />;
    }, [viewMode]);

    return (
        <Page className="flex flex-col h-screen bg-white">
            <Navbar
                transparent
                className="p-0 pt-2"
                left={
                    <button
                        onClick={toggleViewMode}
                        className="p-2"
                    >
                        {ViewModeIcon}
                    </button>
                }
                right={
                    <button
                        onClick={() => navigate('/create')}
                        className="p-2"
                    >
                        <Plus size={24} />
                    </button>
                }
            >
            </Navbar>

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