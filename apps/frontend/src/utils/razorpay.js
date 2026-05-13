import API from '../api/axios';
import { logger } from './logger';

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

/**
 * Initialize Razorpay payment
 */
export const initiatePayment = async (orderId, onSuccess, onFailure) => {
    try {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        
        if (!scriptLoaded) {
            throw new Error('Failed to load Razorpay SDK');
        }

        // Create payment order on backend
        const { data } = await API.post('/payments/create-order', { orderId });

        const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: 'Jain Namkeen',
            description: `Order Payment - ${orderId}`,
            image: '/logo.png', // Your logo
            order_id: data.razorpayOrderId,
            handler: async function (response) {
                try {
                    // Verify payment on backend
                    const verifyResponse = await API.post('/payments/verify', {
                        orderId,
                        paymentData: {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }
                    });

                    logger.info('Payment successful', response);
                    onSuccess(verifyResponse.data);
                } catch (error) {
                    logger.error('Payment verification failed', error);
                    onFailure(error);
                }
            },
            prefill: {
                name: data.customerName || '',
                email: data.customerEmail || '',
                contact: data.customerPhone || ''
            },
            notes: {
                orderId: orderId
            },
            theme: {
                color: '#A04100'
            },
            modal: {
                ondismiss: function() {
                    logger.warn('Payment cancelled by user');
                    onFailure(new Error('Payment cancelled'));
                }
            }
        };

        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', async function (response) {
            logger.error('Payment failed', response.error);
            
            // Record failure on backend
            try {
                await API.post('/payments/failure', {
                    orderId,
                    errorData: response.error
                });
            } catch (err) {
                logger.error('Failed to record payment failure', err);
            }
            
            onFailure(response.error);
        });

        razorpay.open();
    } catch (error) {
        logger.error('Payment initiation failed', error);
        onFailure(error);
    }
};

/**
 * Format amount for display
 */
export const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};
