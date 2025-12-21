import { Home, Clock, ChartNoAxesColumn } from "lucide-react"
import { useLocation, useNavigate } from "react-router"

export default function BottomNav() {
    const { pathname } = useLocation()
    const navigate = useNavigate()

    const tabs = [
        { path: "/", icon: Home, label: "Home" },
        { path: "/timer", icon: Clock, label: "Timer" },
        { path: "/stats", icon: ChartNoAxesColumn, label: "Stats" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 theme-bg-base border-t theme-border pb-safe z-50">
            <div className="max-w-md mx-auto px-4">
                <div className="flex items-center justify-around h-16">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = pathname === tab.path
                        
                        return (
                            <button
                                key={tab.path}
                                onClick={() => navigate(tab.path)}
                                className={`flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-2xl transition-all active:scale-95
                                    ${isActive 
                                        ? 'theme-bg-secondary border theme-border-mute' 
                                        : 'hover:theme-bg-secondary'
                                    }`}
                            >
                                <Icon 
                                    size={24} 
                                    className={isActive ? 'theme-text-gray' : 'theme-text-muted'}
                                    strokeWidth={isActive ? 2 : 1.5}
                                />
                            </button>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}