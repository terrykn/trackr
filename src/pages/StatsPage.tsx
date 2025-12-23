import { useState } from 'react';
import { Page } from "konsta/react";
import BottomNav from "../components/BottomNav";
import WeeklySummaryCard from '../components/WeeklySummaryCard';
import WeeklyCompletionChart from '../components/WeeklyCompletionChart';
import TaskBreakdownCard from '../components/TaskBreakdownCard';

export default function StatsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <Page className="flex flex-col min-h-screen theme-bg-base">
            <div className="flex-1 overflow-y-auto pb-32 pt-4">
                {/* Weekly Stats Summary */}
                <WeeklySummaryCard currentDate={currentDate} />

                {/* Weekly Completion Chart */}
                <WeeklyCompletionChart
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                />

                {/* Task Breakdown */}
                <TaskBreakdownCard currentDate={currentDate} />
            </div>
            <BottomNav />
        </Page>
    );
}