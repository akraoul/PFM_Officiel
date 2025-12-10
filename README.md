# PFM - ESCOBAR Barbershop

Application de réservation en ligne pour le salon de coiffure PFM - ESCOBAR.

## 🏗️ Structure du Projet

```
PFM-Officiel/
├── backend/          # API Node.js + Express + SQLite
├── frontend/         # React + Vite + Tailwind CSS
└── README.md
```

## 🚀 Déploiement

### Frontend → Vercel
### Backend → Railway

---

## 📦 Backend (Railway)

### 1. Prérequis
- Compte Railway (gratuit)
- Git repository

### 2. Déploiement

1. **Créer un projet sur Railway**
   - Aller sur [railway.app](https://railway.app)
   - Cliquer sur "New Project"
   - Sélectionner "Deploy from GitHub repo"
   - Choisir votre repository et le dossier `backend`

2. **Configurer les variables d'environnement**
   - Dans Railway, aller dans l'onglet "Variables"
   - Ajouter :
     ```
     ADMIN_TOKEN=votre_token_securise
     PORT=3000
     NODE_ENV=production
     FRONTEND_URL=https://votre-frontend.vercel.app
     ```

3. **Déploiement automatique**
   - Railway détecte automatiquement Node.js
   - Le build se lance automatiquement
   - Récupérer l'URL générée (ex: `https://pfm-backend.railway.app`)

---

## 🎨 Frontend (Vercel)

### 1. Prérequis
- Compte Vercel (gratuit)
- Git repository

### 2. Déploiement

1. **Créer un projet sur Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "New Project"
   - Importer votre repository GitHub
   - Sélectionner le dossier `frontend` comme Root Directory

2. **Configurer les variables d'environnement**
   - Dans Vercel, aller dans "Settings" > "Environment Variables"
   - Ajouter :
     ```
     VITE_API_URL=https://votre-backend.railway.app/api
     ```

3. **Déploiement**
   - Vercel détecte automatiquement Vite
   - Le build se lance automatiquement
   - Votre site est en ligne !

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
