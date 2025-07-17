import * as admin from 'firebase-admin';
import * as stripeApi from './stripe';

// Initialize Firebase Admin
admin.initializeApp();

// Export Stripe functions
export const createStripeProduct = stripeApi.createProduct;
export const createPaymentIntent = stripeApi.createPaymentIntent;
export const confirmPayment = stripeApi.confirmPayment;
export const cancelBooking = stripeApi.cancelBooking;
export const stripeWebhook = stripeApi.stripeWebhook; 