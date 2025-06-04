import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// Importation des styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style.css';

console.log('Démarrage de l\'application...');

// Création de l'application
const app = createApp(App);

// Configuration de Pinia
const pinia = createPinia();
app.use(pinia);

// Gestion des erreurs globales
app.config.errorHandler = (err, vm, info) => {
  console.error('Erreur Vue:', err);
  console.error('Composant:', vm);
  console.error('Info:', info);
};

// Gestion des erreurs non capturées
window.addEventListener('error', (event) => {
  console.error('Erreur non capturée:', event.error);
});

// Gestion des promesses non gérées
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesse non gérée:', event.reason);
});

// Montage de l'application
app.mount('#app');

console.log('Application montée avec succès');
