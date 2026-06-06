import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '../utils/roleUtils';

const API_BASE = 'http://localhost:8000/api/v1';

export interface AuthUser {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
    employeeId: string;
    isFirstLogin: boolean;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'erp_access_token';
const USER_KEY = 'erp_user_data';

// ── TEST MODE: Mock users (backend not required) ───────────────────────────────
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
    'Admin': {
        password: 'Admin',
        user: {
            id: 'mock-admin-001',
            username: 'Admin',
            fullName: 'Administrator',
            role: 'SUPER_ADMIN',
            employeeId: 'EMP-001',
            isFirstLogin: false,
        }
    },
    'admin': {
        password: 'admin',
        user: {
            id: 'mock-admin-001',
            username: 'admin',
            fullName: 'Administrator',
            role: 'SUPER_ADMIN',
            employeeId: 'EMP-001',
            isFirstLogin: false,
        }
    },
    'khakimovf': {
        password: 'khakimovf',
        user: {
            id: 'mock-it-001',
            username: 'khakimovf',
            fullName: 'Khakimov F.',
            role: 'IT_SPECIALIST',
            employeeId: 'EMP-IT-001',
            isFirstLogin: false,
        }
    },
    'director': {
        password: 'director',
        user: {
            id: 'mock-dir-001',
            username: 'director',
            fullName: 'Director',
            role: 'director',
            employeeId: 'EMP-DIR-001',
            isFirstLogin: false,
        }
    },
};
// ──────────────────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        setIsLoading(true);
        try {
            // ── Mock bypass: check local test credentials first ────────────────
            const mockEntry = MOCK_USERS[username];
            if (mockEntry && mockEntry.password === password) {
                const mockToken = `mock-token-${Date.now()}`;
                localStorage.setItem(TOKEN_KEY, mockToken);
                localStorage.setItem(USER_KEY, JSON.stringify(mockEntry.user));
                setToken(mockToken);
                setUser(mockEntry.user);
                return;
            }
            // ── Otherwise try real backend ─────────────────────────────────────
            const res = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Noto'g'ri username yoki parol");
            }

            const data = await res.json();
            const authUser: AuthUser = {
                id: data.user.id,
                username: data.user.username,
                fullName: data.user.full_name,
                role: data.user.role as UserRole,
                employeeId: data.user.employee_id ?? data.user.id,
                isFirstLogin: data.user.is_first_login ?? false,
            };

            localStorage.setItem(TOKEN_KEY, data.access_token);
            localStorage.setItem(USER_KEY, JSON.stringify(authUser));
            setToken(data.access_token);
            setUser(authUser);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const updatePassword = useCallback(async (oldPassword: string, newPassword: string) => {
        if (!user || !token) throw new Error('Tizimga kirish talab qilinadi');

        const res = await fetch(`${API_BASE}/admin/update-password/${user.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Parolni yangilab bo\'lmadi');
        }

        // Mark first login as done
        const updatedUser = { ...user, isFirstLogin: false };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
    }, [user, token]);

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            updatePassword,
            isAuthenticated: !!user && !!token,
            isLoading,
            token,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
