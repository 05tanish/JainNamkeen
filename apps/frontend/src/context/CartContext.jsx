import { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const CartContext = createContext();

const initialState = {
    items: [],
    loading: false,
};

function cartReducer(state, action) {
    switch (action.type) {
        case 'SET_CART':
            return { ...state, items: action.payload, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: true };
        case 'CLEAR':
            return { ...state, items: [], loading: false };
        default:
            return state;
    }
}

function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const { user } = useAuth();

    // Fetch cart function
    const fetchCart = useCallback(async () => {
        try {
            dispatch({ type: 'SET_LOADING' });
            const { data } = await API.get('/cart');
            dispatch({ type: 'SET_CART', payload: data.items || [] });
        } catch {
            dispatch({ type: 'SET_CART', payload: [] });
        }
    }, []);

    // Fetch cart when user logs in
    useEffect(() => {
        if (user && user.role === 'user') {
            fetchCart();
        } else {
            dispatch({ type: 'CLEAR' });
        }
    }, [user, fetchCart]);

    const addToCart = useCallback(async (productId, quantity = 1) => {
        try {
            const { data } = await API.post('/cart', { productId, quantity });
            dispatch({ type: 'SET_CART', payload: data.items || [] });
        } catch (error) {
            console.error('Add to cart failed:', error);
        }
    }, []);

    const updateQuantity = useCallback(async (productId, quantity) => {
        try {
            const { data } = await API.put(`/cart/${productId}`, { quantity });
            dispatch({ type: 'SET_CART', payload: data.items || [] });
        } catch (error) {
            console.error('Update cart failed:', error);
        }
    }, []);

    const removeFromCart = useCallback(async (productId) => {
        try {
            const { data } = await API.delete(`/cart/${productId}`);
            dispatch({ type: 'SET_CART', payload: data.items || [] });
        } catch (error) {
            console.error('Remove from cart failed:', error);
        }
    }, []);

    const clearCart = useCallback(async () => {
        try {
            await API.delete('/cart/clear');
            dispatch({ type: 'CLEAR' });
        } catch (error) {
            console.error('Clear cart failed:', error);
        }
    }, []);

    const cartCount = useMemo(() => state.items.reduce((sum, item) => sum + item.quantity, 0), [state.items]);
    const cartTotal = useMemo(() => state.items.reduce((sum, item) => {
        const price = item.product?.price || 0;
        return sum + price * item.quantity;
    }, 0), [state.items]);

    const value = useMemo(() => ({
        ...state, cartCount, cartTotal,
        addToCart, updateQuantity, removeFromCart, clearCart, fetchCart
    }), [state, cartCount, cartTotal, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export { CartContext };
export { CartProvider };
