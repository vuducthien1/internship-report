import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isTokenExpired } from '../utils/jwt';
import { getRoleHome } from '../utils/roleRoutes';

const AuthContext = createContext(null);

const USER_KEY = 'vdcm_user';
const TOKEN_KEY = 'accessToken';
const ROLE_KEY = 'role';

const readStoredAuth = () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedToken || !storedUser || isTokenExpired(storedToken)) {
        return { user: null, token: null };
    }

    try {
        return { user: JSON.parse(storedUser), token: storedToken };
    } catch {
        return { user: null, token: null };
    }
};

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(readStoredAuth);
    const { user, token } = auth;

    const clearAuth = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(USER_KEY);
        setAuth({ user: null, token: null });
    }, []);

    const login = useCallback((authToken, userData) => {
        localStorage.setItem(TOKEN_KEY, authToken);
        localStorage.setItem(ROLE_KEY, userData.role);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setAuth({ token: authToken, user: userData });
    }, []);

    const logout = useCallback(() => {
        clearAuth();
    }, [clearAuth]);

    const updateUser = useCallback((userData) => {
        setAuth((current) => {
            const nextUser = { ...current.user, ...userData };
            localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
            return { ...current, user: nextUser };
        });
    }, []);

    useEffect(() => {
        const handleExpired = () => clearAuth();
        window.addEventListener('auth:expired', handleExpired);
        return () => window.removeEventListener('auth:expired', handleExpired);
    }, [clearAuth]);

    const isAuthenticated = !!token && !!user && !isTokenExpired(token);
    const homePath = user ? getRoleHome(user.role) : '/';

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading: false,
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
