import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue"; // Importez votre composant principal App.vue

const routes = [
  {
    path: "/",
    name: "Home",
    component: App, // La page d'accueil sera votre composant App.vue
  },
  {
    path: "/objectifs-financiers",
    name: "FinancialGoals",
    component: () => import("../views/FinancialGoals.vue"), // Importation dynamique de la nouvelle page
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
