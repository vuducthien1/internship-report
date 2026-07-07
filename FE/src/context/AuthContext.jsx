import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCurrentSessionApi, logoutApi } from '../services/authService';
import { getRoleHome } from '../utils/roleRoutes';

const AuthContext = createContext(null);

const clearLegacyTokenStorage = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    localStorage.removeItem('vdcm_user');
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearAuth = useCallback(() => {
        clearLegacyTokenStorage();
        setUser(null);
    }, []);

    useEffect(() => {
        let active = true;
        clearLegacyTokenStorage();

        getCurrentSessionApi()
            .then((result) => {
                if (active) setUser(result.success ? result.user : null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const handleExpired = () => clearAuth();
        window.addEventListener('auth:expired', handleExpired);
        return () => window.removeEventListener('auth:expired', handleExpired);
    }, [clearAuth]);

    const login = useCallback((userData) => {
        clearLegacyTokenStorage();
        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        await logoutApi();
        clearAuth();
    }, [clearAuth]);

    const updateUser = useCallback((userData) => {
        setUser((current) => current ? { ...current, ...userData } : current);
    }, []);

    const isAuthenticated = Boolean(user);
    const homePath = user ? getRoleHome(user.role) : '/';

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated,
                login,
                logout,
                updateUser,
                homePath,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
