# Shree Vastra – Backend API

Express + MongoDB (Mongoose) API for the store: products, accounts, cart, orders and enquiries.
The React frontend is **not connected to it yet**.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then edit .env (MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD)
npm run seed              # loads the 16 sample products + creates the admin account
npm run dev               # http://localhost:5000
```

`npm run seed` **deletes all existing products** before loading the samples, so only use it on a fresh database.
It reads the sample data directly from `../frontend/src/data/products.js`.

## Endpoints

Send the token as `Authorization: Bearer <token>` where "Login" is required.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | `name, email, password, phone?, customerType (retail/wholesale), businessName (wholesale)` |
| POST | `/api/auth/login` | Public | `email, password` → `{ token, user }` |
| GET | `/api/auth/me` | Login | Current user |
| GET | `/api/products` | Public | Query: `category, type, q, featured, isNew, sort (price-low/price-high/newest), page, limit` |
| GET | `/api/products/:id` | Public | One product |
| POST / PUT / DELETE | `/api/products[/:id]` | Admin | Manage products |
| GET | `/api/cart` | Login | Cart lines + totals |
| POST | `/api/cart/items` | Login | `productId, size, color, qty` |
| PATCH / DELETE | `/api/cart/items/:itemId` | Login | Change quantity / remove |
| DELETE | `/api/cart` | Login | Empty the cart |
| POST | `/api/orders` | Login | `shippingAddress { fullName, phone, line1, line2?, city, state, pincode }, notes?` – turns the cart into an order |
| GET | `/api/orders/mine` | Login | My orders |
| GET | `/api/orders/:id` | Owner / Admin | One order |
| GET | `/api/orders` | Admin | All orders (`?status=`) |
| PATCH | `/api/orders/:id/status` | Admin | `status`, `paymentStatus` |
| POST | `/api/enquiries/wholesale` | Public | `name, businessName, phone, email, city, productCategory, quantity, message?` |
| POST | `/api/enquiries/contact` | Public | `name, email, phone?, message` |
| GET | `/api/enquiries` | Admin | List (`?type=&status=`) |
| PATCH | `/api/enquiries/:id/status` | Admin | `new / contacted / closed` |

Product responses use the same shape as the frontend sample data (`id`, `isNew`, `sizes`, `colors`, ...), except `id` is now a MongoDB id string instead of a number.

## Business rules (edit in `src/config/pricing.js`)

- Shipping ₹99, free when the order is ₹1,999 or more.
- Wholesale accounts must order at least 20 pieces, and get 10% / 15% / 20% off at 20 / 50 / 100+ pieces.
- Prices always come from the database; the client never sends prices.

## Not included yet

- Payments: orders are created with `paymentStatus: "pending"`.
- Wholesale account approval: anyone can register as wholesale.
- Password reset, email notifications, product image uploads, stock tracking.
