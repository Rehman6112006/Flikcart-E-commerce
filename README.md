# ShopEase - Modern E-Commerce Platform

A full-featured, mobile-friendly e-commerce website built with Next.js, React, and Tailwind CSS.

## Features

- **Homepage**: Hero banner with sale offers, category cards, trending products with ratings
- **Product Listing**: Filter sidebar (price, brand, rating), sort options, responsive grid
- **Product Detail**: Image gallery, color/size selector, quantity picker, add to cart, reviews
- **Shopping Cart**: Item list, quantity controls, price summary, coupon codes
- **Checkout**: Step-by-step form, address input, payment methods (Card, UPI, COD)
- **User Dashboard**: Orders, wishlist, profile management

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: Express.js, MongoDB, TypeScript
- **State Management**: Zustand
- **Icons**: Lucide React

## Color Scheme

- Primary Blue: `#2563EB`
- Accent Orange: `#FF6B00`
- Soft Gray: `#F8F9FA`
- White Background

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (optional for development)

### Installation

1. **Frontend Setup**
```
bash
cd frontend
npm install
npm run dev
```

2. **Backend Setup** (Optional - uses mock data by default)
```
bash
cd backend
npm install
npm run dev
```

3. **Environment Variables**

Create `.env` file in backend:
```
env
MONGODB_URI=mongodb://localhost:27017/shopease
PORT=5000
```

## Project Structure

```
frontend/
├── src/
│   ├── app/           # Next.js pages
│   │   ├── page.tsx           # Homepage
│   │   ├── products/         # Product listing
│   │   ├── product/[id]/     # Product detail
│   │   ├── cart/             # Shopping cart
│   │   ├── checkout/         # Checkout page
│   │   └── dashboard/        # User dashboard
│   ├── components/    # Reusable components
│   └── store/        # State management
├── public/
└── package.json

backend/
├── src/
│   ├── index.ts      # Express server
│   └── routes/       # API routes
├── package.json
└── tsconfig.json
```

## Available Pages

- `/` - Homepage
- `/products` - Product listing with filters
- `/product/[id]` - Product detail page
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/dashboard` - User dashboard

## License

MIT
