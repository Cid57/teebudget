# Guide de Développement - TeeBudget

## Table des matières
1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Structure du Projet](#structure-du-projet)
4. [Technologies Utilisées](#technologies-utilisées)
5. [Configuration](#configuration)
6. [Architecture](#architecture)
7. [Développement](#développement)
8. [Déploiement](#déploiement)
9. [Bonnes Pratiques](#bonnes-pratiques)
10. [Dépannage](#dépannage)

## Prérequis

- Node.js (v16+)
- npm (v8+)
- Un éditeur de code (VS Code recommandé)

## Installation

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

## Structure du Projet

```
TeeBudget/
├── public/              # Fichiers statiques
├── src/
│   ├── assets/          # Images, polices, etc.
│   ├── components/      # Composants Vue.js réutilisables
│   ├── stores/          # Gestion d'état avec Pinia
│   │   ├── index.js     # Export des stores
│   │   └── useTransactionStore.js  # Store des transactions
│   ├── App.vue          # Composant racine
│   ├── main.js          # Point d'entrée de l'application
│   └── style.css        # Styles globaux
├── .gitignore           # Fichiers ignorés par Git
├── index.html           # Template HTML principal
├── package.json         # Dépendances et scripts
└── vite.config.js       # Configuration Vite
```

## Technologies Utilisées

- **Vue 3** - Framework JavaScript progressif
- **Vite** - Outil de build ultra-rapide
- **Pinia** - Gestion d'état
- **Bootstrap 5** - Framework CSS
- **Bootstrap Icons** - Bibliothèque d'icônes CSS

## Configuration

### Fichier de configuration principal (vite.config.js)
```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()]
});
```

### Fichier principal (main.js)
```javascript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.mount('#app');
```

## Structure du fichier style.css

Le fichier `style.css` contient les styles de base et les utilitaires personnalisés pour l'application. Il est organisé comme suit :

1. **Variables CSS** : Définition des couleurs et des espacements
2. **Styles de base** : Styles globaux pour le body, les liens, etc.
3. **Composants** : Styles pour les cartes, boutons, formulaires, etc.
4. **Utilitaires** : Classes utilitaires pour la mise en page
5. **Icônes** : Styles de base pour les icônes Bootstrap

### Exemple d'extrait

```css
/* Variables */
:root {
  --primary: #0d6efd;
  --secondary: #6c757d;
  --success: #198754;
  --danger: #dc3545;
  --light: #f8f9fa;
  --dark: #212529;
}

/* Styles de base */
body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
  color: #212529;
  background-color: #f8f9fa;
}
```

## Architecture

### Gestion d'état avec Pinia

#### Structure du store (stores/useTransactionStore.js)
```javascript
import { defineStore } from 'pinia';

export const useTransactionStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    categories: [
      { id: 1, name: 'Alimentation', type: 'expense', color: 'bg-red-100' },
      // ... autres catégories
    ],
  }),
  
  getters: {
    getTransactions: (state) => state.transactions,
    getCategories: (state) => state.categories,
    getBalance: (state) => {
      return state.transactions.reduce((total, t) => 
        t.type === 'income' ? total + t.amount : total - t.amount, 0);
    },
  },
  
  actions: {
    addTransaction(transaction) {
      this.transactions.push({
        id: Date.now(),
        ...transaction,
        date: new Date().toISOString(),
      });
      this.saveToLocalStorage();
    },
    
    removeTransaction(id) {
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.saveToLocalStorage();
    },
    
    loadFromLocalStorage() {
      const saved = localStorage.getItem('transactions');
      if (saved) this.transactions = JSON.parse(saved);
    },
    
    saveToLocalStorage() {
      localStorage.setItem('transactions', JSON.stringify(this.transactions));
    },
  },
});
```

## Développement

### Commandes disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile pour la production
- `npm run preview` - Prévue la version de production

### Ajout d'une nouvelle fonctionnalité

1. **Créer un nouveau composant** dans `src/components/`
2. **Définir le store** si nécessaire dans `src/stores/`
3. **Importer et utiliser** le composant dans `App.vue`
4. **Ajouter les styles** avec des classes Tailwind CSS

## Déploiement

### Préparation pour la production
```bash
npm run build
```

### Déploiement sur Vercel/Netlify

1. **Connectez** votre compte GitHub à Vercel/Netlify
2. **Importez** le dépôt TeeBudget
3. **Configurez** les paramètres de build :
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Déployez** !

## Bonnes Pratiques

### Général
- Suivre les conventions de nommage Vue.js
- Utiliser la Composition API avec `<script setup>`
- Documenter les composants avec des commentaires clairs

### Gestion d'état
- Utiliser Pinia pour la gestion d'état global
- Diviser les stores par domaine fonctionnel
- Utiliser les getters pour les données dérivées

### Styles
- Utiliser les classes utilitaires Tailwind dans un premier temps
- Extraire les styles répétitifs dans des composants ou des classes personnalisées
- Utiliser les directives `@apply` avec parcimonie

## Dépannage

### Erreurs courantes

#### Problèmes d'installation
```bash
# Si les dépendances ne s'installent pas correctement
rm -rf node_modules package-lock.json
npm install
```

#### Problèmes de styles
- Vérifier la configuration de Tailwind dans `tailwind.config.js`
- S'assurer que PostCSS est correctement configuré
- Vérifier que les fichiers sont bien inclus dans la section `content`

#### Erreurs de build
- Vérifier les logs de la console pour plus de détails
- S'assurer que toutes les dépendances sont à jour
- Vérifier la compatibilité des versions

## Licence

MIT - Voir le fichier [LICENSE](LICENSE) pour plus de détails.
