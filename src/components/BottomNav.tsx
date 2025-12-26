import { Home, Clock, ChartNoAxesColumn } from "lucide-react"
import { useLocation, useNavigate } from "react-router"
import { Tabbar, TabbarLink, Icon, ToolbarPane } from "konsta/react"

export default function BottomNav() {
    const { pathname } = useLocation()
    const navigate = useNavigate()

    return (
        <Tabbar
            icons
            labels
            className="fixed left-0 bottom-0 right-0 z-20"
        >
            <ToolbarPane className="bg-white/50 max-w-xs h-16 mx-auto shadow-none border theme-border">
                <TabbarLink
                    active={pathname === '/'}
                    onClick={() => navigate('/')}
                    icon={
                        <Icon
                            ios={
                                <Home
                                    className="w-7 h-7"
                                    strokeWidth={pathname === '/' ? 2 : 1.5}
                                />
                            }
                        />
                    }
                    label="Home"
                />
                <TabbarLink
                    active={pathname === '/timer'}
                    onClick={() => navigate('/timer')}
                    icon={
                        <Icon
                            ios={
                                <Clock
                                    className="w-7 h-7"
                                    strokeWidth={pathname === '/timer' ? 2 : 1.5}
                                />
                            }
                        />
                    }
                    label="Focus"
                />
                <TabbarLink
                    active={pathname === '/stats'}
                    onClick={() => navigate('/stats')}
                    icon={
                        <Icon
                            ios={
                                <ChartNoAxesColumn
                                    className="w-7 h-7"
                                    strokeWidth={pathname === '/stats' ? 2 : 1.5}
                                />
                            }
                        />
                    }
                    label="Stats"
                />
            </ToolbarPane>
        </Tabbar>
    )
}