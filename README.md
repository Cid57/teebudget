# TEEBUDGET 💰

[![Vue.js](https://img.shields.io/badge/Vue.js-3.3.4-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Pinia](https://img.shields.io/badge/Pinia-2.1.7-FFD02C?logo=pinia&logoColor=white)](https://pinia.vuejs.org/)

**TEEBUDGET** est une application de gestion de budget personnelle moderne et intuitive, construite avec **Vue 3**, **Vite**, **Pinia** et **Tailwind CSS**.

## ✨ Fonctionnalités

### 🚀 Principales
- 📊 Suivi des revenus et dépenses en temps réel
- 🏷️ Catégories personnalisables (alimentation, loyer, loisirs, etc.)
- 💰 Calcul automatique du solde global
- 📱 Interface responsive et moderne
- 💾 Sauvegarde locale des données avec `localStorage`

### 🔄 Gestion des transactions
- ➕ Ajout rapide de transactions
- ❌ Suppression facile
- 🗂️ Filtrage par catégorie et type
- 📅 Tri chronologique

## 🛠️ Technologies

- **Frontend**
  - [Vue.js 3](https://vuejs.org/) - Framework JavaScript progressif
  - [Vite](https://vitejs.dev/) - Outil de build ultra-rapide
  - [Pinia](https://pinia.vuejs.org/) - Gestion d'état
  - [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitaire
  - [PostCSS](https://postcss.org/) - Traitement des styles

## 🚀 Démarrage rapide

### Prérequis
- Node.js 16+ et npm 8+
- Un navigateur web moderne

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/Cid57/teebudget.git
   cd teebudget
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   L'application sera disponible à l'adresse : http://localhost:5173

4. **Pour la production**
   ```bash
   npm run build
   npm run preview
   ```

## 📂 Structure du projet

```
src/
├── assets/          # Fichiers statiques (images, polices)
├── components/      # Composants Vue.js réutilisables
├── stores/          # Gestion d'état avec Pinia
│   ├── index.js     # Export des stores
│   └── useTransactionStore.js  # Store des transactions
├── App.vue          # Composant racine
├── main.js          # Point d'entrée de l'application
└── style.css        # Styles globaux
```

## 📝 Fonctionnalités à venir

- [ ] Graphiques et statistiques avancés
- [ ] Export/import des données (CSV/JSON)
- [ ] Synchronisation multi-appareils
- [ ] Thème sombre/clair
- [ ] Catégories personnalisables par l'utilisateur
- [ ] Rapports mensuels/annuels

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [Vue.js](https://vuejs.org/) - Un framework JavaScript incroyablement simple
- [Vite](https://vitejs.dev/) - Pour une expérience de développement ultra-rapide
- [Tailwind CSS](https://tailwindcss.com/) - Pour des interfaces modernes et réactives
- [Pinia](https://pinia.vuejs.org/) - Pour une gestion d'état simple et efficace
