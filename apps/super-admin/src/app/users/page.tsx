"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface User {
    id: string;
    full_name: string;
    email: string;
    role: "tourist" | "guide" | "agency_admin" | "super_admin";
    created_at: string;
    is_active: boolean;
    is_verified?: boolean;
    dni?: string;
    phone?: string;
    agency_name?: string;
}

// Mock data for demonstration
const MOCK_USERS: User[] = [
    { id: "1", full_name: "Carlos García", email: "carlos@example.com", role: "tourist", created_at: "2024-01-15", is_active: true, is_verified: true, phone: "+51987654321" },
    { id: "2", full_name: "María López", email: "maria@example.com", role: "guide", created_at: "2024-01-10", is_active: true, is_verified: true, dni: "12345678", agency_name: "Inca Treks" },
    { id: "3", full_name: "Pedro Rodríguez", email: "pedro@example.com", role: "tourist", created_at: "2024-02-01", is_active: false, is_verified: false },
    { id: "4", full_name: "Ana Martínez", email: "ana@example.com", role: "guide", created_at: "2024-01-20", is_active: true, is_verified: false, dni: "87654321", agency_name: "Peru Adventures" },
    { id: "5", full_name: "Luis Fernandez", email: "luis@example.com", role: "agency_admin", created_at: "2024-01-05", is_active: true, is_verified: true, agency_name: "Inca Treks" },
];

const ROLES = ["all", "tourist", "guide", "agency_admin"];
const VERIFICATION_STATES = ["all", "verified", "pending"];
const AGENCIES = ["all", "Inca Treks", "Peru Adventures", "Ruta Segura"];

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [verificationFilter, setVerificationFilter] = useState("all");
    const [agencyFilter, setAgencyFilter] = useState("all");
    const [dniSearch, setDniSearch] = useState("");
    const [sortField, setSortField] = useState<keyof User>("created_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            // In production, this would fetch from API with filters
            // const data = await api.getUsers({ role, verification, agency, search });
            await new Promise((r) => setTimeout(r, 500)); // Simulate network
            setUsers(MOCK_USERS);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Filtered and sorted users
    const filteredUsers = useMemo(() => {
        let result = [...users];

        // Search filter
        if (search) {
            const query = search.toLowerCase();
            result = result.filter(
                (u) =>
                    u.full_name?.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query) ||
                    u.phone?.includes(query)
            );
        }

        // DNI search
        if (dniSearch) {
            result = result.filter((u) => u.dni?.includes(dniSearch));
        }

        // Role filter
        if (roleFilter !== "all") {
            result = result.filter((u) => u.role === roleFilter);
        }

        // Verification filter
        if (verificationFilter !== "all") {
            result = result.filter((u) =>
                verificationFilter === "verified" ? u.is_verified : !u.is_verified
            );
        }

        // Agency filter
        if (agencyFilter !== "all") {
            result = result.filter((u) => u.agency_name === agencyFilter);
        }

        // Sorting
        result.sort((a, b) => {
            const aVal = a[sortField] ?? "";
            const bVal = b[sortField] ?? "";
            if (sortDirection === "asc") {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

        return result;
    }, [users, search, dniSearch, roleFilter, verificationFilter, agencyFilter, sortField, sortDirection]);

    const handleSort = (field: keyof User) => {
        if (sortField === field) {
            setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            tourist: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
            guide: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            agency_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
            super_admin: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        };
        return styles[role] || "bg-slate-500/20 text-slate-400";
    };

    const stats = useMemo(
        () => ({
            total: users.length,
            tourists: users.filter((u) => u.role === "tourist").length,
            guides: users.filter((u) => u.role === "guide").length,
            verified: users.filter((u) => u.is_verified).length,
        }),
        [users]
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
                        <p className="text-slate-400 mt-1">
                            Base de datos nacional de turistas, guías y agencias
                        </p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                            ← Centro de Mando
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: "Total Usuarios", value: stats.total, icon: "👥", color: "cyan" },
                        { label: "Turistas", value: stats.tourists, icon: "🧳", color: "blue" },
                        { label: "Guías", value: stats.guides, icon: "🏔️", color: "emerald" },
                        { label: "Verificados", value: stats.verified, icon: "✓", color: "green" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4"
                        >
                            <span className="text-3xl">{stat.icon}</span>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-slate-400">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="grid grid-cols-5 gap-4">
                        <input
                            type="text"
                            placeholder="Buscar nombre, email, teléfono..."
                            className="col-span-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-cyan-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Buscar por DNI..."
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-cyan-500 outline-none"
                            value={dniSearch}
                            onChange={(e) => setDniSearch(e.target.value)}
                        />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 outline-none"
                        >
                            {ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {r === "all" ? "Todos los roles" : r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={verificationFilter}
                            onChange={(e) => setVerificationFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 outline-none"
                        >
                            {VERIFICATION_STATES.map((v) => (
                                <option key={v} value={v}>
                                    {v === "all" ? "Estado verificación" : v === "verified" ? "Verificados" : "Pendientes"}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                        <select
                            value={agencyFilter}
                            onChange={(e) => setAgencyFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 outline-none"
                        >
                            {AGENCIES.map((a) => (
                                <option key={a} value={a}>
                                    {a === "all" ? "Todas las agencias" : a}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setSearch("");
                                setDniSearch("");
                                setRoleFilter("all");
                                setVerificationFilter("all");
                                setAgencyFilter("all");
                            }}
                            className="px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Limpiar filtros
                        </button>
                        <span className="ml-auto text-sm text-slate-500">
                            {filteredUsers.length} resultados
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-300 text-sm border-b border-slate-800">
                            <tr>
                                <th
                                    className="p-4 cursor-pointer hover:text-cyan-400"
                                    onClick={() => handleSort("full_name")}
                                >
                                    Usuario {sortField === "full_name" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4">Email</th>
                                <th
                                    className="p-4 cursor-pointer hover:text-cyan-400"
                                    onClick={() => handleSort("role")}
                                >
                                    Rol {sortField === "role" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4">DNI</th>
                                <th className="p-4">Verificación</th>
                                <th className="p-4">Agencia</th>
                                <th
                                    className="p-4 cursor-pointer hover:text-cyan-400"
                                    onClick={() => handleSort("created_at")}
                                >
                                    Registro {sortField === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        <div className="animate-pulse">Cargando usuarios...</div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        No se encontraron usuarios con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${user.is_active ? "bg-cyan-500/20" : "bg-slate-700"
                                                        }`}
                                                >
                                                    {user.role === "guide" ? "🏔️" : user.role === "agency_admin" ? "🏢" : "👤"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{user.full_name || "Sin nombre"}</p>
                                                    <p className="text-xs text-slate-500">{user.phone || ""}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300">{user.email}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadge(user.role)}`}
                                            >
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 font-mono text-sm">{user.dni || "-"}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${user.is_verified
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-yellow-500/20 text-yellow-400"
                                                    }`}
                                            >
                                                {user.is_verified ? "✓ Verificado" : "⏳ Pendiente"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 text-sm">{user.agency_name || "-"}</td>
                                        <td className="p-4 text-slate-400 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                                                    Ver
                                                </button>
                                                <button className="px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors">
                                                    Editar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
