import { createContext, useReducer, useEffect, useState, useMemo, useCallback } from 'react';
import API from '../api/axios';
import { logger } from '../utils/logger';

const AuthContext = createContext();

// NO localStorage - auth state comes ONLY from server via httpOnly cookies
const initialState = {
    user: null,
    loading: false,
    error: null,
};

function authReducer(state, action) {
    switch (action.type) {
        case 'AUTH_START':
            return { ...state, loading: true, error: null };
        case 'AUTH_SUCCESS':
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
    const [isInitialized, setIsInitialized] = useState(false);

    // On mount: verify session with server using httpOnly cookie
    // This is the ONLY source of truth for auth state
    useEffect(() => {
        const verifySession = async () => {
            try {
                const { data } = await API.get('/auth/me');
                // Cookie is valid - set user from server response
                dispatch({ type: 'SET_USER', payload: data });
            } catch {
                // Cookie is expired or invalid - user is not authenticated
                dispatch({ type: 'LOGOUT' });
            } finally {
                setIsInitialized(true);
            }
        };

        verifySession();
    }, []);

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
            // data = { requiresVerification: true, email }
            dispatch({ type: 'AUTH_ERROR', payload: null }); // clear loading
            return data; // caller handles redirect to /verify-email
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
            logger.error('Logout failed', err);
        }
        dispatch({ type: 'LOGOUT' });
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
