import { useState, useMemo } from 'react';
import { Page, Navbar, Link } from "konsta/react";
import { WeekView, WeekViewHeader, DayView, DayViewHeader } from '../components/Calendar';
import BottomNav from '../components/BottomNav';
import { Calendar1, CalendarDays, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';

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
            <Navbar
                className="pb-2 border-b theme-border"
                title={
                    <span className="z-10 text-lg font-bold tracking-wide">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                }
                left={
                    <Link onClick={toggleViewMode}>
                        {ViewModeIcon}
                    </Link>
                }
                right={
                    <Link onClick={() => navigate('/create')}>
                        <Plus size={20} strokeWidth={2} />
                    </Link>
                }
                subnavbar={
                    viewMode === 'day' ? (
                        <DayViewHeader currentDate={currentDate} onDateChange={setCurrentDate} />
                    ) : (
                        <WeekViewHeader currentDate={currentDate} onDateChange={setCurrentDate} />
                    )
                }
            />

            <div className="flex-1 overflow-hidden relative">
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