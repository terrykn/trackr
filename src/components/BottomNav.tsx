import { Icon, TabbarLink, Toolbar, ToolbarPane } from "konsta/react"
import { Home, Clock, ChartNoAxesColumn } from "lucide-react"
import { useLocation, useNavigate } from "react-router"

export default function BottomNav() {
    const { pathname } = useLocation()
    const navigate = useNavigate()

    const tabs = [
        { path: "/", icon: <Home size={24} /> },
        { path: "/timer", icon: <Clock size={24} /> },
        { path: "/stats", icon: <ChartNoAxesColumn size={24} /> },
    ]

    return (
        <Toolbar className="sticky bottom-3 mt-auto mx-auto">
            <ToolbarPane className="max-w-xs mx-auto">
                {tabs.map((tab) => (
                    <TabbarLink
                        key={tab.path}
                        component="a"
                        onClick={() => navigate(tab.path)}
                        icon={<Icon ios={tab.icon} />}
                        active={pathname === tab.path}
                    />
                ))}
            </ToolbarPane>
        </Toolbar>
    )
}
