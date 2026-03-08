import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../utils/roleUtils';

interface User {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
    employeeId: string;
    isFirstLogin: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    updatePassword: (newPassword: string) => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial mock users
const MOCK_USERS: User[] = [
    {
        id: 'admin-1',
        username: 'admin',
        fullName: 'System Administrator',
        role: 'ADMIN',
        employeeId: 'ADM-001',
        isFirstLogin: false
    },
    {
        id: 'vgm-1',
        username: 'vgm_guard',
        fullName: 'Azamat Qosimov',
        role: 'VGM_GUARD' as any, // Adding VGM_GUARD to UserRole type later if needed
        employeeId: 'VGM-101',
        isFirstLogin: true
    }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>({
        id: 'it-specialist-1',
        username: 'Khakimovf',
        fullName: 'Khakimovf (ROOT)',
        employeeId: 'IT-001',
        role: 'IT_SPECIALIST' as any,
        isFirstLogin: false
    });
    const [isLoading, setIsLoading] = useState(false);

    const login = async () => {};
    const logout = () => {};
    const updatePassword = async () => {};

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            updatePassword,
            isAuthenticated: true,
            isLoading: false
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
