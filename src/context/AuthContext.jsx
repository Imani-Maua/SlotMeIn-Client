import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Provides auth state (token, role, user) to the whole app.
 * Stores the access token in localStorage so it survives page refreshes.
 */
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('access_token'));
    const [role, setRole] = useState(() => localStorage.getItem('user_role'));

    const saveAuth = useCallback((access_token, user_role) => {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_role', user_role);
        setToken(access_token);
        setRole(user_role);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        setToken(null);
        setRole(null);
    }, []);

    const isAuthenticated = Boolean(token);

    return (
        <AuthContext.Provider value={{ token, role, isAuthenticated, saveAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/** Hook to access auth context anywhere in the app. */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
