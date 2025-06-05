<script setup>
// Ici, nous mettrons le code JavaScript (logique) de la page
// Pour l'instant, nous laissons vide car nous nous concentrons sur la structure visuelle.
import { ref } from "vue";

// Exemple de données pour les objectifs (nous les rendrons dynamiques plus tard)
const financialGoals = ref([
  {
    id: 1,
    name: "Épargne Vacances",
    currentAmount: 1500,
    targetAmount: 3000,
    deadline: "2024-07-01",
    monthlyProgress: -4,
  },
  {
    id: 2,
    name: "Fonds d'urgence",
    currentAmount: 3000,
    targetAmount: 6000,
    deadline: "2024-12-31",
    monthlyProgress: -10,
  },
]);

// Fonctions pour la date limite et la progression (à compléter)
const formatDate = (dateString) => {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Date(dateString).toLocaleDateString("fr-FR", options);
};

const calculateProgressPercentage = (current, target) => {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100).toFixed(0);
};
</script>

<template>
  <div class="container py-4">
    <!-- En-tête de la page -->
    <header class="d-flex justify-content-between align-items-center mb-5">
      <h1 class="display-6 fw-bold">Objectifs Financiers</h1>
      <button class="btn btn-primary rounded-pill">
        <i class="bi bi-plus me-2"></i> Nouvel Objectif
      </button>
    </header>

    <!-- Liste des objectifs -->
    <div class="row g-4">
      <!-- Boucle sur les objectifs -->
      <div v-for="goal in financialGoals" :key="goal.id" class="col-md-6">
        <div class="card h-100 shadow-sm p-4">
          <div class="card-body d-flex flex-column">
            <!-- Titre et actions -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="h5 fw-semibold mb-0">{{ goal.name }}</h2>
              <div>
                <button
                  class="btn btn-sm btn-link text-muted p-0 me-2"
                  title="Modifier"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn btn-sm btn-link text-muted p-0"
                  title="Supprimer"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <!-- Montants et barre de progression -->
            <div class="mb-3">
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span>{{ goal.currentAmount.toFixed(2) }} €</span>
                <span>{{ goal.targetAmount.toFixed(2) }} €</span>
              </div>
              <div class="progress" style="height: 8px">
                <div
                  class="progress-bar bg-warning"
                  role="progressbar"
                  :style="{
                    width:
                      calculateProgressPercentage(
                        goal.currentAmount,
                        goal.targetAmount
                      ) + '%',
                  }"
                  :aria-valuenow="
                    calculateProgressPercentage(
                      goal.currentAmount,
                      goal.targetAmount
                    )
                  "
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div class="text-end small text-muted mt-1">
                {{
                  calculateProgressPercentage(
                    goal.currentAmount,
                    goal.targetAmount
                  )
                }}%
              </div>
            </div>

            <!-- Détails de l'objectif -->
            <div class="mt-auto">
              <div class="small text-muted mb-2">
                <i class="bi bi-calendar me-2"></i> Date limite:
                {{ formatDate(goal.deadline) }}
              </div>
              <div class="small text-muted mb-3">
                <i class="bi bi-graph-up me-2"></i> Progression mensuelle:
                {{ goal.monthlyProgress }}%
              </div>

              <!-- Bouton Ajouter contribution -->
              <button class="btn btn-success w-100 rounded-pill">
                <i class="bi bi-plus-circle me-2"></i> Ajouter une contribution
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles spécifiques pour cette page */
/* Les styles généraux de App.vue seront appliqués si non surchargés */

.card {
  border-radius: 1rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
}

.btn {
  border-radius: 2rem;
  transition: all 0.2s;
}
.btn:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress {
  height: 8px;
}

.progress-bar {
  background-color: #f59e42 !important; /* Utilisation de la couleur orange de App.vue */
}
</style>
