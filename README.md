# Sree Kavinya Tex – Full Stack Clothing Store

This repository contains both the **Frontend** (React + Vite) and the **Backend** (Express + MongoDB).

---

## Project Structure

```
shree-vastra-store/
├── frontend/             # React + Vite client
│   ├── src/              # Pages, components, styles, data
│   ├── package.json      # Frontend dependencies & scripts
│   └── vite.config.js
│
├── backend/              # Express + MongoDB API server
│   ├── src/              # Routes, controllers, models, middleware
│   ├── .env              # Environment config (MONGO_URI, JWT_SECRET, etc.)
│   └── package.json      # Backend dependencies & scripts
│
└── .gitignore            # Root gitignore
```

---

## 1. Running the Frontend (Client)

```bash
cd frontend
npm install
npm run dev
```

* **Local dev URL**: `http://localhost:5173`
* **Production build**: `npm run build`

---

## 2. Running the Backend (API Server)

```bash
cd backend
npm install
npm run dev
```

* **Local API URL**: `http://localhost:5000`
* **Live Render API URL**: `https://codelearnbackend.onrender.com`
* **Health check**: `https://codelearnbackend.onrender.com/api/health`
* **Seed database**: `npm run seed` (loads initial products & creates admin user)
