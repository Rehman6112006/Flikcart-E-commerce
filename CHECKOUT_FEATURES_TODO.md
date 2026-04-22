# Checkout Features Implementation TODO

## Priority 1: Promo/Coupon Code System ✅ COMPLETED
- [x] Create Coupon model in backend (percentage/fixed, min order, usage limit, date range)
- [x] Add coupon API endpoints (validate + full admin CRUD)
- [x] Add coupon input in checkout page
- [x] Calculate discount in order summary
- [x] Admin Coupons page (/admin/coupons) with create/edit/delete/toggle
- [x] Order tracks coupon code & increments usedCount on purchase

## Priority 2: Admin Payment Verification ✅ COMPLETED
- [x] Pending payments endpoint (GET /api/admin/payments/pending)
- [x] Verify/reject payment API (PUT /api/admin/verify-payment)
- [x] Admin payment verification page (/admin/payments) with detail modal
- [x] Added Payments link to admin sidebar navigation

## Priority 3: Guest Checkout ✅ COMPLETED
- [x] Guest checkout endpoint (POST /api/guest-orders) - no auth required
- [x] Saves guest orders by email, auto-links if account exists
- [x] Guest order tracking (POST /api/track-guest-order)
- [x] Updated checkout to auto-detect guest vs authenticated users
- [x] Guest users redirected to track-order page after successful order

## Priority 4: Order Cancellation ✅ ALREADY DONE (pre-existing)
- [x] Backend cancellation API with reason field
- [x] Cancel modal in dashboard with required reason
- [x] Stock restoration on cancellation

## Priority 5: Payment Retry ✅ COMPLETED
- [x] Enhanced payment-failed page with retry button & helpful tips
- [x] Cart preserved on failure for seamless retry

## Priority 6: Invoice Generation ✅ COMPLETED
- [x] PDF/HTML invoice endpoint (GET /api/invoices/:orderId)
- [x] Professional invoice template with store branding
- [x] Download Invoice button in user dashboard orders list
- [x] Auto-triggers browser print dialog for save-as-PDF

---

**Status: ALL CHECKOUT FEATURES COMPLETE** ✅
