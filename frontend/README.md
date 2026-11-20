# Shree Vastra – Clothing Store UI

Frontend-only UI (React + Vite) for a clothing business with retail and wholesale customers.
No backend, database, payments or real authentication yet.

## Run locally

```bash
npm install
npm run dev
```

Build for production: `npm run build`

## Structure

```
src/
  components/   Reusable UI (Navbar, Footer, ProductCard, WholesaleForm, ...)
  pages/        One file per page (Home, Men, Women, Kids, Wholesale, Cart, ...)
  data/         Sample products (products.js) and store details (site.js)
  utils/        Small helpers (price formatting)
  styles/       Global stylesheet (index.css)
```

## Notes

- Product data is sample data in `src/data/products.js`.
- Product images are placeholders (`ProductImage.jsx`) – replace with real `<img>` tags later.
- Store name, phone, email and address live in `src/data/site.js`.
- Forms (wholesale, contact, login) only show UI behaviour; nothing is sent anywhere yet.
