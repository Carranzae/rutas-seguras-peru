import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Agency {
    id: string
    name: string
    ruc: string
    email: string
    phone: string
    logo_url?: string
    is_verified: boolean
}

interface User {
    id: string
    email: string
    full_name: string
    role: "agency_admin" | "agency_staff"
    agency_id: string
}

interface AuthState {
    user: User | null
    agency: Agency | null
    token: string | null
    isAuthenticated: boolean

    // Actions
    login: (user: User, agency: Agency, token: string) => void
    logout: () => void
    updateAgency: (agency: Partial<Agency>) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            agency: null,
            token: null,
            isAuthenticated: false,

            login: (user, agency, token) => {
                localStorage.setItem("agency_token", token)
                set({ user, agency, token, isAuthenticated: true })
            },

            logout: () => {
                localStorage.removeItem("agency_token")
                set({ user: null, agency: null, token: null, isAuthenticated: false })
            },

            updateAgency: (agencyUpdate) => {
                set((state) => ({
                    agency: state.agency ? { ...state.agency, ...agencyUpdate } : null,
                }))
            },
        }),
        {
            name: "agency-auth",
            partialize: (state) => ({
                user: state.user,
                agency: state.agency,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
