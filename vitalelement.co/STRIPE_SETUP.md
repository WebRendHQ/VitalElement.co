# Stripe Integration Setup for Vital Elements

This document explains how to set up the Stripe integration for the Vital Elements platform to handle payments for experience bookings.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com) if you don't have one)
2. Firebase project with Functions enabled
3. Firebase Admin SDK set up in your backend

## Setup Steps

### 1. Stripe Account Setup

1. Create a Stripe account or log into your existing account
2. Go to the Developers section and get your API keys:
   - Publishable key (for client-side)
   - Secret key (for server-side only)
3. Set up a webhook endpoint for receiving Stripe events
   - Point it to your Firebase function URL: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
   - Get your webhook signing secret

### 2. Configure Firebase Functions

1. Set up environment variables for your Firebase Functions:

```bash
firebase functions:config:set stripe.secret="YOUR_STRIPE_SECRET_KEY" stripe.webhook_secret="YOUR_WEBHOOK_SECRET"
```

2. Make sure your Firebase project has the appropriate billing plan enabled (Blaze plan) to make external API calls from Cloud Functions

### 3. Update Client App

1. In `vitalelementapp/app/lib/stripe.ts`, update the `STRIPE_PUBLISHABLE_KEY` with your Stripe publishable key:

```typescript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY';
```

2. Make sure the Firebase Functions URL is correct in `vitalelementapp/app/lib/stripe-api.ts`:

```typescript
const API_BASE_URL = 'https://us-central1-YOUR_PROJECT.cloudfunctions.net';
```

## How the Integration Works

1. **Experience Creation**: When a user creates a new experience, a Stripe product is created to represent it
2. **Booking Flow**: 
   - When a user books an experience, a payment intent is created in Stripe
   - The user enters their card details in the custom checkout UI
   - The payment is processed directly with Stripe
   - Upon successful payment, the booking status is updated to confirmed
3. **Cancellation & Refund Flow**:
   - When a user cancels a booking, the system processes a refund automatically
   - The related Stripe product is archived (soft delete)
   - The booking status is updated to 'cancelled'
   - Refund information is stored in the database
4. **Webhook Handling**:
   - Stripe sends events to our webhook endpoint
   - The webhook processes events like successful payments, failed payments, etc.
   - Booking records are updated based on payment status

## Testing

1. Use Stripe test cards for testing payments:
   - `4242 4242 4242 4242` - Successful payment
   - `4000 0000 0000 0002` - Declined payment
   - Expiration date: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

2. Test the refund functionality:
   - Book an experience with a test card
   - Cancel the booking to trigger the refund process
   - Verify in the Stripe dashboard that the refund was processed

3. Monitor Firebase Functions logs and Stripe dashboard events for debugging

## Troubleshooting

- Check Firebase Functions logs for any errors
- Verify Stripe API keys are correctly set up
- Ensure webhook endpoint is correctly configured
- Test with Stripe's test mode before going to production

## Going to Production

1. Switch to production Stripe API keys
2. Update webhook endpoints for production
3. Implement proper error handling and notifications
4. Set up monitoring and alerts
5. Consider implementing refund policies and limits

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Refunds API](https://stripe.com/docs/api/refunds)
- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Stripe React Native Documentation](https://github.com/stripe/stripe-react-native) 