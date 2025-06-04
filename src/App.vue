<script setup>
import { ref, onMounted, computed, onBeforeMount, watch } from "vue";
import { useTransactionStore } from "./stores/useTransactionStore.js";
import { useUserStore } from "./stores/useUserStore.js";
import Chart from "chart.js/auto";

console.log("Démarrage du composant App.vue");

const transactionStore = useTransactionStore();
const userStore = useUserStore();

// État de chargement
const isLoading = ref(true);
const error = ref(null);

// Initialiser les stores
onBeforeMount(async () => {
  try {
    console.log("Initialisation des stores...");
    await userStore.init();
    console.log("UserStore initialisé", userStore);
    await transactionStore.init();
    console.log("TransactionStore initialisé", transactionStore);
    isLoading.value = false;
  } catch (err) {
    console.error("Erreur lors de l'initialisation des stores:", err);
    error.value =
      "Erreur lors du chargement de l'application. Veuillez rafraîchir la page.";
    isLoading.value = false;
  }
});

// Transaction en cours de création
const newTransaction = ref({
  description: "",
  amount: "",
  type: "expense",
  categoryId: 1,
});

// Basculer entre les utilisateurs
const switchUser = (userId) => {
  userStore.setCurrentUser(userId);
};

// Confettis (revenu) et gouttes rouges (dépense)
const confettiCanvas = ref(null);
function launchConfetti(type = "income") {
  if (!confettiCanvas.value) return;
  const canvas = confettiCanvas.value;
  const ctx = canvas.getContext("2d");
  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);
  const particles = [];
  let colors;
  if (type === "income") {
    colors = [
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
    ];
  } else {
    colors = ["#ef4444", "#b91c1c", "#f87171", "#dc2626"]; // Gouttes rouges
  }
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * W,
      y: type === "income" ? (Math.random() * H) / 2 : -20,
      r: type === "income" ? Math.random() * 8 + 4 : Math.random() * 6 + 8,
      d: Math.random() * 40 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      speed: type === "income" ? 0 : Math.random() * 2 + 2,
    });
  }
  let angle = 0;
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    angle += 0.01;
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      if (type === "income") {
        p.y += (Math.cos(angle + p.d) + 1 + p.r / 2) / 2;
        p.x += Math.sin(angle);
        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
      } else {
        // Animation goutte
        p.y += p.speed;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r / 2, Math.PI, 2 * Math.PI);
        ctx.lineTo(p.x + p.r / 2, p.y + p.r);
        ctx.arc(p.x, p.y + p.r, p.r / 2, 0, Math.PI);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    frame++;
    if (frame < 80) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  }
  draw();
}

// Ajouter une transaction pour l'utilisateur courant
function addTransaction() {
  if (!newTransaction.value.description || !newTransaction.value.amount) return;
  const isPositive = newTransaction.value.type === "income";
  transactionStore.addTransaction(userStore.currentUserId, {
    ...newTransaction.value,
    amount: parseFloat(newTransaction.value.amount),
  });
  setTimeout(() => launchConfetti(isPositive ? "income" : "expense"), 100);
  // Réinitialiser le formulaire
  newTransaction.value = {
    description: "",
    amount: "",
    type: "expense",
    categoryId: 1,
  };
}

// Supprimer une transaction
const deleteTransaction = (transactionId) => {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
    transactionStore.deleteTransaction(userStore.currentUserId, transactionId);
  }
};

// Transactions filtrées par type pour l'utilisateur courant
const incomeTransactions = computed(() =>
  transactionStore.getTransactionsByType(userStore.currentUserId, "income")
);

const expenseTransactions = computed(() =>
  transactionStore.getTransactionsByType(userStore.currentUserId, "expense")
);

// Calcul des totaux
const currentBalance = computed(() =>
  transactionStore.totalBalance(userStore.currentUserId)
);

const currentIncome = computed(() =>
  transactionStore.totalIncome(userStore.currentUserId)
);

const currentExpenses = computed(() =>
  transactionStore.totalExpenses(userStore.currentUserId)
);

// Liste des transactions de l'utilisateur courant
const currentUserTransactions = computed(() =>
  transactionStore.getTransactions(userStore.currentUserId)
);

// Préparation des données pour le graphique des dépenses par catégorie
const chartRef = ref(null);
const chartInstance = ref(null);

const expenseByCategory = computed(() => {
  // On filtre les transactions de type "expense" pour l'utilisateur courant
  const expenses = transactionStore.getTransactionsByType(
    userStore.currentUserId,
    "expense"
  );
  const result = {};
  expenses.forEach((tx) => {
    const cat = transactionStore.getCategoryById(tx.categoryId).name;
    if (!result[cat]) result[cat] = 0;
    result[cat] += tx.amount;
  });
  return result;
});

onMounted(() => {
  // Création du graphique au montage du composant
  if (chartRef.value) {
    createOrUpdateChart();
  }
});

// Met à jour le graphique quand les données changent
watch(expenseByCategory, () => {
  createOrUpdateChart();
});

function createOrUpdateChart() {
  if (!chartRef.value) return;
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
  const data = expenseByCategory.value;
  chartInstance.value = new Chart(chartRef.value, {
    type: "doughnut",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: [
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
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
        title: {
          display: true,
          text: "Répartition des dépenses par catégorie",
          font: { size: 18 },
        },
      },
    },
  });
}

const showModal = ref(false);
function openModal() {
  showModal.value = true;
}
function closeModal() {
  showModal.value = false;
}

const selectedMonth = ref(new Date().getMonth());
const selectedYear = ref(new Date().getFullYear());

// Génère la liste des mois pour la navigation
const monthNames = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function prevMonth() {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11;
    selectedYear.value--;
  } else {
    selectedMonth.value--;
  }
}
function nextMonth() {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0;
    selectedYear.value++;
  } else {
    selectedMonth.value++;
  }
}

// Filtre les transactions du mois sélectionné
const monthlyTransactions = computed(() => {
  return transactionStore
    .getTransactions(userStore.currentUserId)
    .filter((tx) => {
      const date = new Date(tx.date);
      return (
        date.getMonth() === selectedMonth.value &&
        date.getFullYear() === selectedYear.value
      );
    });
});

const monthlyIncome = computed(() =>
  monthlyTransactions.value
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
);
const monthlyExpenses = computed(() =>
  monthlyTransactions.value
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
);
const monthlyBalance = computed(
  () => monthlyIncome.value - monthlyExpenses.value
);

// Surprise UX/UI : badge d'encouragement
const previousMonth = computed(() => {
  let m = selectedMonth.value - 1;
  let y = selectedYear.value;
  if (m < 0) {
    m = 11;
    y--;
  }
  return transactionStore
    .getTransactions(userStore.currentUserId)
    .filter((tx) => {
      const date = new Date(tx.date);
      return date.getMonth() === m && date.getFullYear() === y;
    });
});
const previousMonthBalance = computed(() => {
  const income = previousMonth.value
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = previousMonth.value
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return income - expenses;
});
const encouragement = computed(() => {
  if (monthlyBalance.value > 0)
    return "Bravo ! Vous avez un solde positif ce mois-ci 🎉";
  if (monthlyBalance.value > previousMonthBalance.value)
    return "Félicitations, vous avez économisé plus que le mois dernier ! 🏆";
  return "";
});
</script>

<template>
  <div class="min-vh-100 bg-light py-4">
    <div class="container">
      <!-- En-tête -->
      <header class="text-center mb-5">
        <div
          class="d-flex justify-content-center align-items-center mb-3 gap-3"
        >
          <div
            :style="{ backgroundColor: userStore.currentUser.color }"
            class="text-white p-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center"
            style="width: 60px; height: 60px; font-size: 2rem"
          >
            <i class="bi bi-people-fill"></i>
          </div>
        </div>
        <h1 class="display-5 fw-bold mb-2">TeeBudget</h1>
        <p class="lead text-primary mb-1">Votre budget, votre liberté.</p>
        <p class="text-muted">Gérez facilement votre budget à plusieurs</p>

        <!-- Sélecteur d'utilisateur -->
        <div class="btn-group mt-3" role="group">
          <button
            v-for="user in userStore.users"
            :key="user.id"
            @click="switchUser(user.id)"
            class="btn"
            :class="
              userStore.currentUserId === user.id
                ? 'btn-primary'
                : 'btn-outline-primary'
            "
          >
            {{ user.name }}
          </button>
        </div>
      </header>

      <div class="row g-4">
        <!-- Carte de solde modernisée et centrée -->
        <div class="col-md-4 d-flex align-items-center justify-content-center">
          <div class="card h-100 shadow-sm w-100" style="max-width: 400px">
            <div
              class="card-body d-flex flex-column align-items-center justify-content-center text-center p-4"
            >
              <div
                class="d-flex justify-content-between align-items-center w-100 mb-3"
              >
                <h2 class="h6 text-muted mb-0 text-start">
                  Solde de {{ userStore.currentUser.name }}
                </h2>
                <i
                  class="bi bi-person-circle"
                  :style="{
                    color: userStore.currentUser.color,
                    fontSize: '1.5rem',
                  }"
                ></i>
              </div>
              <div
                class="d-flex flex-column align-items-center justify-content-center w-100 mb-3"
              >
                <div
                  class="d-flex align-items-center justify-content-center gap-3 w-100"
                >
                  <i
                    class="bi"
                    :class="
                      currentBalance >= 0
                        ? 'bi-graph-up-arrow'
                        : 'bi-graph-down-arrow'
                    "
                    :style="{
                      fontSize: '2.5rem',
                      color: currentBalance >= 0 ? '#10b981' : '#ef4444',
                    }"
                  ></i>
                  <span
                    :class="{
                      'text-success': currentBalance >= 0,
                      'text-danger': currentBalance < 0,
                    }"
                    style="font-size: 2.8rem; font-weight: bold"
                    >{{ currentBalance.toFixed(2) }}</span
                  >
                  <span
                    :class="{
                      'text-success': currentBalance >= 0,
                      'text-danger': currentBalance < 0,
                    }"
                    style="font-size: 2rem; font-weight: bold"
                    >€</span
                  >
                </div>
                <!-- Message d'alerte si le solde est négatif -->
                <transition name="fade">
                  <div
                    v-if="currentBalance < 0"
                    class="alert alert-danger mt-3 py-2 px-3"
                    style="font-size: 1.1rem"
                  >
                    Attention, votre solde est négatif !
                  </div>
                </transition>
              </div>
              <div class="d-flex justify-content-center w-100 gap-5 mt-2">
                <div class="text-success d-flex flex-column align-items-center">
                  <i
                    class="bi bi-arrow-down-circle"
                    style="font-size: 1.5rem"
                  ></i>
                  <div class="small">Revenus</div>
                  <div class="fw-bold">+{{ currentIncome.toFixed(2) }} €</div>
                </div>
                <div class="text-danger d-flex flex-column align-items-center">
                  <i
                    class="bi bi-arrow-up-circle"
                    style="font-size: 1.5rem"
                  ></i>
                  <div class="small">Dépenses</div>
                  <div class="fw-bold">-{{ currentExpenses.toFixed(2) }} €</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulaire d'ajout -->
        <div class="col-md-8">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h2 class="h5 fw-semibold mb-4">Nouvelle transaction</h2>
              <form @submit.prevent="addTransaction">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="description" class="form-label"
                      >Description</label
                    >
                    <input
                      v-model="newTransaction.description"
                      type="text"
                      id="description"
                      class="form-control"
                      placeholder="Ex: Courses du week-end"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label for="amount" class="form-label">Montant (€)</label>
                    <div class="input-group">
                      <span class="input-group-text">€</span>
                      <input
                        v-model="newTransaction.amount"
                        type="number"
                        step="0.01"
                        id="amount"
                        class="form-control"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label for="type" class="form-label">Type</label>
                    <select
                      v-model="newTransaction.type"
                      id="type"
                      class="form-select"
                    >
                      <option value="expense">Dépense</option>
                      <option value="income">Revenu</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label for="category" class="form-label">Catégorie</label>
                    <select
                      v-model="newTransaction.categoryId"
                      id="category"
                      class="form-select"
                    >
                      <option
                        v-for="category in transactionStore.categories"
                        :key="category.id"
                        :value="category.id"
                      >
                        {{ category.name }}
                      </option>
                    </select>
                  </div>
                  <div class="col-12 mt-2">
                    <button type="submit" class="btn btn-primary w-100">
                      <i class="bi bi-plus-circle me-2"></i>Ajouter la
                      transaction
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <!-- Fin de la première rangée -->

      <!-- Liste des transactions -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card shadow-sm">
            <div class="card-header bg-white py-3">
              <h2 class="h5 mb-0">
                <i class="bi bi-list-ul me-2"></i>Historique des transactions
              </h2>
            </div>
            <div class="card-body p-0">
              <!-- État vide -->
              <div
                v-if="currentUserTransactions.length === 0"
                class="text-center py-5"
              >
                <div class="text-muted">
                  <i class="bi bi-receipt fs-1 opacity-50"></i>
                  <p class="mt-2 mb-0">Aucune transaction enregistrée</p>
                  <small class="text-muted"
                    >Ajoutez votre première transaction pour commencer</small
                  >
                </div>
              </div>

              <!-- Liste des transactions -->
              <div
                v-if="
                  incomeTransactions.length > 0 ||
                  expenseTransactions.length > 0
                "
              >
                <!-- Revenus -->
                <div v-if="incomeTransactions.length > 0" class="mb-4">
                  <h6 class="text-success fw-semibold mb-3">
                    <i class="bi bi-arrow-down-circle me-2"></i>Revenus
                    <span
                      class="badge bg-success bg-opacity-10 text-success ms-2"
                      >{{ incomeTransactions.length }}</span
                    >
                  </h6>
                  <ul class="list-group list-group-flush mb-4">
                    <transition-group name="fade" tag="div">
                      <li
                        v-for="(transaction, idx) in incomeTransactions"
                        :key="transaction.id"
                        class="list-group-item list-group-item-action"
                        :class="{
                          'border-bottom':
                            idx !== incomeTransactions.length - 1,
                        }"
                      >
                        <div class="d-flex align-items-center">
                          <div
                            class="bg-success bg-opacity-10 text-success rounded-circle p-2 me-3"
                          >
                            <i class="bi bi-arrow-down-circle fs-5"></i>
                          </div>
                          <div class="flex-grow-1">
                            <div
                              class="d-flex justify-content-between align-items-center"
                            >
                              <h6 class="mb-0">
                                {{ transaction.description }}
                              </h6>
                              <span class="text-success fw-bold">
                                +{{ transaction.amount.toFixed(2) }} €
                              </span>
                            </div>
                            <div
                              class="d-flex align-items-center text-muted small mt-1"
                            >
                              <span
                                class="badge bg-success bg-opacity-10 text-success"
                              >
                                {{
                                  transactionStore.getCategoryById(
                                    transaction.categoryId
                                  ).name
                                }}
                              </span>
                              <span class="mx-2">•</span>
                              <span>{{
                                new Date(transaction.date).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              }}</span>
                            </div>
                          </div>
                          <button
                            @click="deleteTransaction(transaction.id)"
                            class="btn btn-sm btn-link text-muted"
                            title="Supprimer"
                          >
                            <i class="bi bi-x-lg"></i>
                          </button>
                        </div>
                      </li>
                    </transition-group>
                  </ul>
                </div>

                <!-- Dépenses -->
                <div v-if="expenseTransactions.length > 0">
                  <h6 class="text-danger fw-semibold mb-3">
                    <i class="bi bi-arrow-up-circle me-2"></i>Dépenses
                    <span
                      class="badge bg-danger bg-opacity-10 text-danger ms-2"
                      >{{ expenseTransactions.length }}</span
                    >
                  </h6>
                  <ul class="list-group list-group-flush">
                    <transition-group name="fade" tag="div">
                      <li
                        v-for="(transaction, idx) in expenseTransactions"
                        :key="transaction.id"
                        class="list-group-item list-group-item-action"
                        :class="{
                          'border-bottom':
                            idx !== expenseTransactions.length - 1,
                        }"
                      >
                        <div class="d-flex align-items-center">
                          <div
                            class="bg-danger bg-opacity-10 text-danger rounded-circle p-2 me-3"
                          >
                            <i class="bi bi-arrow-up-circle fs-5"></i>
                          </div>
                          <div class="flex-grow-1">
                            <div
                              class="d-flex justify-content-between align-items-center"
                            >
                              <h6 class="mb-0">
                                {{ transaction.description }}
                              </h6>
                              <span class="text-danger fw-bold">
                                -{{ transaction.amount.toFixed(2) }} €
                              </span>
                            </div>
                            <div
                              class="d-flex align-items-center text-muted small mt-1"
                            >
                              <span
                                class="badge bg-danger bg-opacity-10 text-danger"
                              >
                                {{
                                  transactionStore.getCategoryById(
                                    transaction.categoryId
                                  ).name
                                }}
                              </span>
                              <span class="mx-2">•</span>
                              <span>{{
                                new Date(transaction.date).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              }}</span>
                            </div>
                          </div>
                          <button
                            @click="deleteTransaction(transaction.id)"
                            class="btn btn-sm btn-link text-muted"
                            title="Supprimer"
                          >
                            <i class="bi bi-x-lg"></i>
                          </button>
                        </div>
                      </li>
                    </transition-group>
                  </ul>
                </div>
              </div>

              <!-- État vide -->
              <div v-else class="text-center py-5">
                <div class="text-muted">
                  <i class="bi bi-receipt fs-1 opacity-50"></i>
                  <p class="mt-2 mb-0">Aucune transaction enregistrée</p>
                  <small class="text-muted"
                    >Ajoutez votre première transaction pour commencer</small
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Après la carte de solde, j'ajoute le graphique -->
      <div class="row justify-content-center my-4">
        <div class="col-md-6">
          <div class="card p-4">
            <canvas ref="chartRef" height="220"></canvas>
          </div>
        </div>
      </div>

      <!-- Résumé mensuel dynamique -->
      <div class="row justify-content-center my-4">
        <div class="col-md-8">
          <div class="card p-4 text-center">
            <div
              class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"
            >
              <button class="btn btn-outline-primary btn-sm" @click="prevMonth">
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="fw-bold" style="font-size: 1.2rem"
                >{{ monthNames[selectedMonth] }} {{ selectedYear }}</span
              >
              <button class="btn btn-outline-primary btn-sm" @click="nextMonth">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
            <div class="d-flex justify-content-center gap-5 flex-wrap mb-2">
              <div class="d-flex flex-column align-items-center">
                <span class="text-muted">Revenus</span>
                <span class="fw-bold text-success"
                  >+{{ monthlyIncome.toFixed(2) }} €</span
                >
              </div>
              <div class="d-flex flex-column align-items-center">
                <span class="text-muted">Dépenses</span>
                <span class="fw-bold text-danger"
                  >-{{ monthlyExpenses.toFixed(2) }} €</span
                >
              </div>
              <div class="d-flex flex-column align-items-center">
                <span class="text-muted">Solde</span>
                <span
                  :class="{
                    'text-success': monthlyBalance >= 0,
                    'text-danger': monthlyBalance < 0,
                  }"
                  class="fw-bold"
                  >{{ monthlyBalance.toFixed(2) }} €</span
                >
              </div>
            </div>
            <transition name="fade">
              <div
                v-if="encouragement"
                class="alert alert-success mt-3"
                style="font-size: 1.1rem"
              >
                {{ encouragement }}
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Canvas pour les confettis (plein écran, pointer-events none) -->
      <canvas
        ref="confettiCanvas"
        style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 2000;
        "
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
body,
#app {
  background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
  min-height: 100vh;
  font-family: "Inter", Arial, sans-serif;
}
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
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
