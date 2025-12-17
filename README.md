# PFM - ESCOBAR Barbershop

Application de réservation en ligne pour le salon de coiffure PFM - ESCOBAR.

## 🏗️ Structure du Projet

```
PFM-Officiel/
├── backend/          # API (Node.js + Express + SQLite)
│   ├── src/
│   ├── package.json
│   └── pfm.db
├── frontend/         # Frontend (React + Vite + Tailwind CSS)
├── README.md
└── ...
```

## 🚀 Déploiement

### Backend → Railway
1. **Root Directory** : Configurez Railway pour utiliser le dossier `backend` comme racine.
2. **Setup** : Railway détectera automatiquement le projet Node.js.

### Frontend → Vercel
1. **Root Directory** : Sélectionnez le dossier `frontend`.
2. **Setup** : Vercel détectera automatiquement Vite.

---

## 📦 Backend (Railway)

### 1. Configuration Railway

**Essentiel** : Dans les paramètres de votre service Railway, définissez `Root Directory` sur `/backend`.

**Variables d'environnement** :
```
ADMIN_TOKEN=votre_token_securise
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://votre-frontend.vercel.app
```

**Déploiement automatique** : Push sur `main` branch

---

## 🎨 Frontend (Vercel)

### 1. Configuration Vercel

- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Variables d'environnement** :
```
VITE_API_URL=https://votre-backend.railway.app/api
```

---

## 💻 Développement Local

### Backend

```bash
cd backend
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`

---

## 🔧 Technologies

**Backend:**
- Node.js + Express
- SQLite
- TypeScript
- Multer (uploads)

**Frontend:**
- React 18
- Vite
- React Router
- Tailwind CSS
- TypeScript

---

## 📝 Variables d'Environnement

### Backend (.env)
```
ADMIN_TOKEN=votre_token
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://votre-frontend.vercel.app
```

### Frontend (.env.production)
```
VITE_API_URL=https://votre-backend.railway.app/api
```

---

## 🔐 Sécurité

- ⚠️ Ne jamais commit les fichiers `.env`
- ⚠️ Changer `ADMIN_TOKEN` en production
- ⚠️ Vérifier que `.gitignore` exclut les fichiers sensibles

---

## 📞 Support

Pour toute question : [Instagram @pfm_escobar](https://www.instagram.com/pfm_escobar)

---

## 📄 Licence

© 2024 PFM - ESCOBAR. Tous droits réservés.
