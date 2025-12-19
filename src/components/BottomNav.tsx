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
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
            <div className="max-w-md mx-auto px-4">
                <div className="flex items-center justify-around h-16">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = pathname === tab.path
                        
                        return (
                            <button
                                key={tab.path}
                                onClick={() => navigate(tab.path)}
                                className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-2xl transition-all active:scale-95
                                    ${isActive 
                                        ? 'bg-gray-100' 
                                        : 'bg-transparent'
                                    }`}
                            >
                                <Icon 
                                    size={24} 
                                    className={isActive ? 'text-gray-900' : 'text-gray-400'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </button>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}