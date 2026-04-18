import { useEffect, useRef, useCallback, useState } from 'react';
import axios from 'axios';
import API from '../api/axios';
import { logger } from '../utils/logger';

/**
 * Custom hook for making API calls with automatic cancellation on unmount
 * Prevents memory leaks and "Can't perform a React state update on an unmounted component" warnings
 */
export const useAPI = () => {
    const cancelTokenSource = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        // Create cancel token on mount
        cancelTokenSource.current = axios.CancelToken.source();
        isMounted.current = true;

        return () => {
            // Cancel all pending requests on unmount
            if (cancelTokenSource.current) {
                cancelTokenSource.current.cancel('Component unmounted');
            }
            isMounted.current = false;
        };
    }, []);

    const makeRequest = useCallback(async (config) => {
        try {
            const response = await API({
                ...config,
                cancelToken: cancelTokenSource.current?.token
            });
            return { data: response.data, error: null };
        } catch (error) {
            if (axios.isCancel(error)) {
                logger.debug('Request cancelled', error.message);
                return { data: null, error: null, cancelled: true };
            } else {
                logger.apiError('API request failed', error);
                return { data: null, error };
            }
        }
    }, []);

    // Helper methods for common HTTP methods
    const get = useCallback((url, config = {}) => {
        return makeRequest({ method: 'GET', url, ...config });
    }, [makeRequest]);

    const post = useCallback((url, data, config = {}) => {
        return makeRequest({ method: 'POST', url, data, ...config });
    }, [makeRequest]);

    const put = useCallback((url, data, config = {}) => {
        return makeRequest({ method: 'PUT', url, data, ...config });
    }, [makeRequest]);

    const del = useCallback((url, config = {}) => {
        return makeRequest({ method: 'DELETE', url, ...config });
    }, [makeRequest]);

    const patch = useCallback((url, data, config = {}) => {
        return makeRequest({ method: 'PATCH', url, data, ...config });
    }, [makeRequest]);

    return { 
        makeRequest, 
        get, 
        post, 
        put, 
        delete: del, 
        patch,
        isMounted: () => isMounted.current 
    };
};

/**
 * Custom hook for fetching data with loading and error states
 */
export const useFetch = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { get, isMounted } = useAPI();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            const result = await get(url, options);

            if (isMounted()) {
                if (result.error) {
                    setError(result.error);
                } else if (!result.cancelled) {
                    setData(result.data);
                }
                setLoading(false);
            }
        };

        fetchData();
    }, [url, JSON.stringify(options)]); // eslint-disable-line react-hooks/exhaustive-deps

    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
        
        get(url, options).then(result => {
            if (isMounted()) {
                if (result.error) {
                    setError(result.error);
                } else if (!result.cancelled) {
                    setData(result.data);
                }
                setLoading(false);
            }
        });
    }, [url, options, get, isMounted]);

    return { data, loading, error, refetch };
};
