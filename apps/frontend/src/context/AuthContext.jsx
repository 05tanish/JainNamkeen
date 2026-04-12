import { createContext, useReducer, useEffect, useState, useMemo, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false,
    error: null,
};

function authReducer(state, action) {
    switch (action.type) {
        case 'AUTH_START':
            return { ...state, loading: true, error: null };
        case 'AUTH_SUCCESS':
            // The global axios interceptor already unwrapped the user object
            return { ...state, loading: false, user: action.payload, error: null };
        case 'AUTH_ERROR':
            return { ...state, loading: false, error: action.payload };
        case 'LOGOUT':
            return { ...state, user: null, error: null };
        case 'UPDATE_USER':
            return { ...state, user: action.payload };
        case 'SET_USER':
            return { ...state, user: action.payload };
        default:
            return state;
    }
}

function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    // isInitialized: true once we have verified the session with the server.
    // ProtectedRoute waits for this before deciding to redirect.
    const [isInitialized, setIsInitialized] = useState(false);

    // On mount: verify that the httpOnly cookie is still valid by calling /auth/me.
    // This catches the case where localStorage has stale user data but the
    // server-side cookie has expired or been cleared.
    useEffect(() => {
        const verifySession = async () => {
            try {
                const { data } = await API.get('/auth/me');
                // Cookie is valid — sync user state with fresh server data (unwrapped by interceptor)
                dispatch({ type: 'SET_USER', payload: data });
                localStorage.setItem('user', JSON.stringify(data));
            } catch {
                // Cookie is expired or invalid — clear stale user from localStorage
                dispatch({ type: 'LOGOUT' });
                localStorage.removeItem('user');
            } finally {
                // Either way, we now know the true auth state
                setIsInitialized(true);
            }
        };

        verifySession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep localStorage in sync whenever user changes (after initial load)
    useEffect(() => {
        if (!isInitialized) return; // skip during initialization (handled above)
        if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user));
        } else {
            localStorage.removeItem('user');
        }
    }, [state.user, isInitialized]);

    const login = useCallback(async (email, password) => {
        dispatch({ type: 'AUTH_START' });
        try {
            const { data } = await API.post('/auth/login', { email, password });
            dispatch({ type: 'AUTH_SUCCESS', payload: data });
            return data;
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed';
            dispatch({ type: 'AUTH_ERROR', payload: msg });
            throw new Error(msg);
        }
    }, []);

    const register = useCallback(async (userData) => {
        dispatch({ type: 'AUTH_START' });
        try {
            const { data } = await API.post('/auth/register', userData);
            dispatch({ type: 'AUTH_SUCCESS', payload: data });
            return data;
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed';
            dispatch({ type: 'AUTH_ERROR', payload: msg });
            throw new Error(msg);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await API.post('/auth/logout');
        } catch (err) {
            console.error('Logout failed:', err);
        }
        dispatch({ type: 'LOGOUT' });
        localStorage.removeItem('user');
    }, []);

    const updateUser = useCallback((userData) => {
        dispatch({ type: 'UPDATE_USER', payload: userData });
    }, []);

    const value = useMemo(() => ({
        ...state, isInitialized, login, register, logout, updateUser
    }), [state, isInitialized, login, register, logout, updateUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext };
export { AuthProvider };
