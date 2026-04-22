# Implementation Plan

## Task Summary
1. Make checkout page mobile responsive
2. Make my account dashboard mobile responsive  
3. Integrate Stripe Visa card payments into checkout page

## Information Gathered

### Current Project Structure:
- **Backend**: Express/TypeScript with MongoDB, Stripe already installed
- **Frontend**: Next.js 14 with Stripe packages already installed (@stripe/react-stripe-js, @stripe/stripe-js)
- **Checkout Page**: `/frontend/src/app/checkout/page.tsx` - Multi-step form (Shipping → Payment → Review)
- **Dashboard Page**: `/frontend/src/app/dashboard/page.tsx` - User orders, profile, settings tabs

### Stripe Credentials:
- Secret Key: Add your Stripe Secret Key in `backend/.env` file
- Publishable Key: Add your Stripe Publishable Key in `frontend/.env.local` file

### Order Schema already has paymentResult field:
```typescript
paymentResult: {
  id: { type: String },
  status: { type: String },
  email: { type: String }
}
```

## Plan

### Step 1: Backend - Add Stripe Payment API
- [ ] Install stripe package in backend (already installed)
- [ ] Create Stripe payment intent API endpoint
- [ ] Update order with payment status after successful payment

### Step 2: Frontend - Update Checkout Page
- [ ] Add Stripe Elements (CardElement) for secure card input
- [ ] Make checkout page fully responsive (mobile-first)
- [ ] Implement payment intent creation
- [ ] Handle payment success → redirect to payment-success page
- [ ] Handle payment failure → redirect to payment-failed page
- [ ] Set currency to PKR
- [ ] Make amount dynamic from cart total

### Step 3: Frontend - Make Dashboard Responsive
- [ ] Make order list responsive on mobile
- [ ] Make profile form responsive
- [ ] Make settings form responsive
- [ ] Improve navigation on mobile

### Step 4: Create Payment Success/Failed Pages
- [ ] Create `/payment-success/page.tsx`
- [ ] Create `/payment-failed/page.tsx`

## Dependent Files to be Edited:
1. `backend/src/index.ts` - Add Stripe payment endpoints
2. `frontend/src/app/checkout/page.tsx` - Add Stripe integration + responsive design
3. `frontend/src/app/dashboard/page.tsx` - Make responsive
4. `frontend/src/app/layout.tsx` or `checkout/page.tsx` - Add Stripe publishable key
5. Create `frontend/src/app/payment-success/page.tsx`
6. Create `frontend/src/app/payment-failed/page.tsx`

## Followup Steps:
1. Test Stripe payment flow
2. Verify responsive design on mobile viewport
3. Test payment success/failure redirects

