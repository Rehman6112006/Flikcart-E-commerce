// API Base URL - Change this in .env.local for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Direct URL helper for custom endpoints
export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
  VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
  RESEND_OTP: `${API_BASE_URL}/api/auth/resend-otp`,
  VERIFY_RESET_OTP: `${API_BASE_URL}/api/auth/verify-reset-otp`,
  
  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCT_DETAIL: (id: string) => `${API_BASE_URL}/api/products/${id}`,
  
  // Cart & Wishlist
  CART: `${API_BASE_URL}/api/cart`,
  WISHLIST: `${API_BASE_URL}/api/wishlist`,
  
  // Orders
  ORDERS: `${API_BASE_URL}/api/orders`,
  ORDER_DETAIL: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
  TRACK_ORDER: (id: string) => `${API_BASE_URL}/api/orders/track/${id}`,
  CANCEL_ORDER: (id: string) => `${API_BASE_URL}/api/orders/${id}/cancel`,
  RETURN_ORDER: `${API_BASE_URL}/api/orders/return`,
  CREATE_ORDER: `${API_BASE_URL}/api/orders/create`,
  USER_ORDERS: `${API_BASE_URL}/api/orders/user/orders`,
  
  // Checkout
  APPLY_COUPON: `${API_BASE_URL}/api/coupons/apply`,
  VALIDATE_COUPON: `${API_BASE_URL}/api/coupons/validate`,
  
  // Reviews
  REVIEWS: (productId: string) => `${API_BASE_URL}/api/reviews/product/${productId}`,
  CREATE_REVIEW: `${API_BASE_URL}/api/reviews`,
  
  // Admin
  ADMIN_LOGIN: `${API_BASE_URL}/api/admin/login`,
  ADMIN_PRODUCTS: `${API_BASE_URL}/api/admin/products`,
  ADMIN_ORDERS: `${API_BASE_URL}/api/admin/orders`,
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_COUPONS: `${API_BASE_URL}/api/admin/coupons`,
  ADMIN_RIDERS: `${API_BASE_URL}/api/admin/riders`,
  ADMIN_RETURN_ORDERS: `${API_BASE_URL}/api/admin/return-orders`,
  ADMIN_ANALYTICS: `${API_BASE_URL}/api/admin/analytics`,
  
  // Rider
  RIDER_LOGIN: `${API_BASE_URL}/api/rider/login`,
  RIDER_REGISTER: `${API_BASE_URL}/api/rider/register`,
  RIDER_ORDERS: `${API_BASE_URL}/api/rider/orders`,
  RIDER_PROFILE: `${API_BASE_URL}/api/rider/profile`,
  RIDER_UPDATE_ORDER: (id: string) => `${API_BASE_URL}/api/rider/orders/${id}`,
  
  // Payments
  PAYMENT_INTENT: `${API_BASE_URL}/api/payment/create-intent`,
  
  // Uploads
  UPLOAD: `${API_BASE_URL}/api/upload`,
  UPLOAD_IMAGE: (filename: string) => `${API_BASE_URL}/uploads/${filename}`,
  
  // Forgot Password
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
}

export default API_BASE_URL
