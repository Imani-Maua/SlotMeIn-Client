import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Provides auth state (token, role, firstname) to the whole app.
 * Stores data in localStorage so it survives page refreshes.
 * firstname is populated at login time via saveAuth().
 */
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('access_token'));
    const [role, setRole] = useState(() => localStorage.getItem('user_role'));
    const [firstname, setFirstname] = useState(() => localStorage.getItem('user_firstname'));

    const saveAuth = useCallback((access_token, user_role, user_firstname) => {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_role', user_role);
        localStorage.setItem('user_firstname', user_firstname);
        setToken(access_token);
        setRole(user_role);
        setFirstname(user_firstname);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_firstname');
        setToken(null);
        setRole(null);
        setFirstname(null);
    }, []);

    const isAuthenticated = Boolean(token);

    return (
        <AuthContext.Provider value={{ token, role, firstname, isAuthenticated, saveAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
