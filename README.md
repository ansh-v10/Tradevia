# Tradevia - Kirana B2B Wholesale App

A premium B2B wholesale platform for Kirana stores, department stores, and small businesses to purchase essentials, FMCG, and sweets at direct distributor rates.

## Features

### Storefront
- Product catalog with category/brand browsing and search
- Tiered wholesale pricing (Base / Medium / Bulk) with dynamic price breaks
- Product variants support
- Cart with MOQ enforcement, inventory validation, and persistent localStorage
- Multi-address checkout with Leaflet/OpenStreetMap location picker
- GST invoice PDF download (18% CGST/SGST breakdown)
- Customer reviews and ratings
- Wishlist synced to Supabase
- Order history with cancel and return/refund requests
- Real-time order status (pending → confirmed → processing → out for delivery → shipped → delivered)
- Courier tracking links (Delhivery, Blue Dart, DTDC, India Post, etc.)
- Back-in-stock email notifications
- Recently viewed products
- Image lightbox on product details
- Bulk CSV order upload (`/bulk-order`)
- Email verification, password reset, and profile management (name, business, mobile, GSTIN, avatar)
- Loading spinners throughout

### Admin Panel (`/admin`)
- Product CRUD with image upload (URL or file to Supabase Storage)
- Category management (add/edit/delete, home page visibility)
- Bulk price adjustment (percentage across all products)
- Catalog factory reset
- Order management with granular status workflow
- Courier assignment and tracking number entry
- Return/refund request management
- Customer database with order history (frequency, total spent)
- Sales analytics (revenue, avg order value, top products)
- Price change history
- CSV export (Orders, Customers, Analytics, Price History)
- Low stock / out-of-stock alerts
- Toast notifications and loading spinners

### Backend
- Supabase Auth (admin whitelisted via `admins` table)
- Supabase PostgreSQL database with Row Level Security
- Razorpay payment integration (test mode)
- SMTP email notifications (order confirmation, shipping updates)
- Automatic inventory decrement on payment
- Order reconciliation on API server startup
- SECURITY DEFINER RPCs for cancellations and coupon usage

## Tech Stack
- React 19, Vite 8, React Router
- Supabase (Auth, Database, Storage)
- Razorpay (Payments)
- Leaflet / OpenStreetMap (Location picker)
- Nodemailer (SMTP Email)
- html2canvas + jsPDF (GST Invoice PDF)

## Getting Started

```bash
npm install
npm run dev        # Starts Vite frontend + API server
```

The API server runs on port 3001 and handles Razorpay, email, and image upload endpoints.

## Environment Variables

Copy `.env` and configure:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (test keys)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`
- `FROM_EMAIL`
- `VITE_API_BASE_URL`
