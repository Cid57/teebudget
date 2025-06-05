<template>
  <div class="container py-4">
    <AppHeader @toggle-dark="toggleDark" />
    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="card h-100 shadow-sm w-100">
          <div
            class="card-body d-flex flex-column align-items-center justify-content-center text-center p-4"
          >
            <h2 class="h6 text-muted mb-0 text-start">Solde</h2>
            <span class="display-4 fw-bold text-success">{{ balance }} €</span>
            <div class="d-flex justify-content-center w-100 gap-5 mt-2">
              <div class="text-success d-flex flex-column align-items-center">
                <i
                  class="bi bi-arrow-down-circle"
                  style="font-size: 1.5rem"
                ></i>
                <div class="small">Revenus</div>
                <div class="fw-bold">+{{ income }} €</div>
              </div>
              <div class="text-danger d-flex flex-column align-items-center">
                <i class="bi bi-arrow-up-circle" style="font-size: 1.5rem"></i>
                <div class="small">Dépenses</div>
                <div class="fw-bold">-{{ expenses }} €</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-8">
        <div class="card h-100 shadow-sm p-4">
          <div class="card-body">
            <h2 class="h5 fw-semibold mb-4">Graphique des dépenses</h2>
            <BudgetChart :data="chartData" />
          </div>
        </div>
      </div>
    </div>
    <FabButton @add="openAddModal" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useTransactionStore } from "../stores/useTransactionStore";
import { useUserStore } from "../stores/useUserStore";
import AppHeader from "../components/AppHeader.vue";
import FabButton from "../components/FabButton.vue";
import BudgetChart from "../components/BudgetChart.vue";

const transactionStore = useTransactionStore();
const userStore = useUserStore();

const balance = computed(() =>
  transactionStore.totalBalance(userStore.currentUserId)
);
const income = computed(() =>
  transactionStore.totalIncome(userStore.currentUserId)
);
const expenses = computed(() =>
  transactionStore.totalExpenses(userStore.currentUserId)
);

const chartData = computed(() => {
  const expensesList = transactionStore.getTransactionsByType(
    userStore.currentUserId,
    "expense"
  );
  const byCategory = {};
  expensesList.forEach((tx) => {
    const cat = transactionStore.getCategoryById(tx.categoryId).name;
    if (!byCategory[cat]) byCategory[cat] = 0;
    byCategory[cat] += tx.amount;
  });
  return {
    labels: Object.keys(byCategory),
    values: Object.values(byCategory),
    colors: [
      "#4f46e5",
      "#10b981",
      "#f59e42",
      "#ef4444",
      "#6366f1",
      "#fbbf24",
      "#14b8a6",
      "#e11d48",
      "#a21caf",
      "#f472b6",
      "#22d3ee",
      "#fde68a",
      "#f87171",
      "#34d399",
      "#818cf8",
    ],
  };
});

const isDark = ref(false);
function toggleDark() {
  isDark.value = !isDark.value;
  document.body.classList.toggle("dark", isDark.value);
}
function openAddModal() {
  /* à implémenter : ouvrir la modale d'ajout */
}
</script>

<style scoped>
.container {
  max-width: 1100px;
}
</style>
