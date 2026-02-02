"use client"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
    AlertTriangle,
    Bell,
    Calendar,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Map,
    Menu,
    Settings,
    Users,
    Wallet,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Mapa en Vivo", href: "/map", icon: Map },
    { name: "Tours", href: "/tours", icon: Calendar },
    { name: "Reservas", href: "/bookings", icon: Calendar },
    { name: "Guías", href: "/guides", icon: Users },
    { name: "Billetera", href: "/wallet", icon: Wallet },
    { name: "Configuración", href: "/settings", icon: Settings },
]

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const pathname = usePathname()
    const { agency, logout } = useAuthStore()

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">RS</span>
                        </div>
                        <span className="font-bold text-lg">Ruta Segura</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className={collapsed ? "mx-auto" : ""}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </Button>
            </div>

            {/* Agency info */}
            {!collapsed && agency && (
                <div className="p-4 border-b">
                    <p className="font-medium truncate">{agency.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{agency.ruc}</p>
                    {agency.is_verified && (
                        <span className="inline-flex items-center text-xs text-green-600 mt-1">
                            ✓ Verificada
                        </span>
                    )}
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-accent text-foreground",
                                collapsed && "justify-center"
                            )}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon size={20} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="p-2 border-t">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
                        collapsed ? "justify-center px-0" : "justify-start"
                    )}
                    onClick={logout}
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
                </Button>
            </div>
        </aside>
    )
}

export function Topbar() {
    const { user, agency } = useAuthStore()
    const [sosCount] = useState(0) // TODO: Connect to WebSocket

    return (
        <header className="fixed top-0 right-0 z-30 h-16 bg-card border-b flex items-center justify-between px-6 ml-64">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu size={20} />
                </Button>
                <h1 className="text-xl font-semibold hidden sm:block">
                    Panel de Control - {agency?.name || "Agencia"}
                </h1>
            </div>

            <div className="flex items-center gap-3">
                {/* SOS Alert Button */}
                {sosCount > 0 && (
                    <Button variant="sos" size="sm" className="gap-2">
                        <AlertTriangle size={16} />
                        <span>{sosCount} SOS Activo</span>
                    </Button>
                )}

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">
                        3
                    </span>
                </Button>

                {/* User menu */}
                <div className="flex items-center gap-3 pl-3 border-l">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium">
                            {user?.full_name?.charAt(0) || "A"}
                        </span>
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-sm font-medium">{user?.full_name || "Admin"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                </div>
            </div>
        </header>
    )
}
