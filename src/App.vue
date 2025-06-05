<script setup>
import { ref, onMounted, computed, onBeforeMount, watch } from "vue";
import { useTransactionStore } from "./stores/useTransactionStore.js";
import { useUserStore } from "./stores/useUserStore.js";
import Chart from "chart.js/auto";
import AppHeader from "./components/AppHeader.vue";
import BudgetChart from "./components/BudgetChart.vue";

console.log("Démarrage du composant App.vue");

const transactionStore = useTransactionStore();
const userStore = useUserStore();

// État de chargement
const isLoading = ref(true);
const error = ref(null);

// État de recherche et filtrage
const searchQuery = ref("");
const filterDate = ref("");
const filterAmount = ref("");
const filterCategory = ref("");

// État de tri
const sortBy = ref("date"); // 'date', 'amount', 'description', 'category'
const sortOrder = ref("desc"); // 'asc' ou 'desc'

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

// Transactions filtrées et triées
const filteredAndSortedTransactions = computed(() => {
  let transactions = currentUserTransactions.value;

  // Filtre par recherche textuelle
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    transactions = transactions.filter(
      (tx) =>
        tx.description.toLowerCase().includes(query) ||
        transactionStore
          .getCategoryById(tx.categoryId)
          .name.toLowerCase()
          .includes(query)
    );
  }

  // Filtre par date
  if (filterDate.value) {
    const filterDateObj = new Date(filterDate.value);
    transactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.toDateString() === filterDateObj.toDateString();
    });
  }

  // Filtre par montant
  if (filterAmount.value) {
    const amount = parseFloat(filterAmount.value);
    transactions = transactions.filter((tx) => tx.amount >= amount);
  }

  // Filtre par catégorie
  if (filterCategory.value) {
    transactions = transactions.filter(
      (tx) => tx.categoryId === parseInt(filterCategory.value)
    );
  }

  // Tri
  return transactions.sort((a, b) => {
    let comparison = 0;
    const aValue =
      sortBy.value === "category"
        ? transactionStore.getCategoryById(a.categoryId).name
        : a[sortBy.value];
    const bValue =
      sortBy.value === "category"
        ? transactionStore.getCategoryById(b.categoryId).name
        : b[sortBy.value];

    if (sortBy.value === "date") {
      // Comparaison de dates (plus récent en premier par défaut pour 'desc')
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      comparison = dateA - dateB; // Pour trier par date, plus ancienne d'abord
    } else if (sortBy.value === "amount") {
      // Comparaison de montants
      comparison = aValue - bValue; // Pour trier par montant, plus petit d'abord
    } else {
      // Comparaison de chaînes (description, catégorie)
      if (aValue > bValue) comparison = 1;
      else if (aValue < bValue) comparison = -1;
    }

    // Appliquer l'ordre (asc/desc)
    if (sortOrder.value === "desc") {
      if (sortBy.value === "date" || sortBy.value === "amount") {
        // Pour date et montant, 'desc' signifie les plus grands en premier
        return comparison * -1;
      } else {
        // Pour les chaînes, 'desc' signifie Z-A
        return comparison * -1;
      }
    } else {
      // Ordre croissant par défaut (ou A-Z pour les chaînes)
      return comparison;
    }
  });
});

// Transactions filtrées par type (utilisant filteredAndSortedTransactions)
const filteredAndSortedIncomeTransactions = computed(() =>
  filteredAndSortedTransactions.value.filter((tx) => tx.type === "income")
);

const filteredAndSortedExpenseTransactions = computed(() =>
  filteredAndSortedTransactions.value.filter((tx) => tx.type === "expense")
);

// Réinitialiser les filtres et le tri
function resetFiltersAndSort() {
  searchQuery.value = "";
  filterDate.value = "";
  filterAmount.value = "";
  filterCategory.value = "";
  sortBy.value = "date";
  sortOrder.value = "desc";
}

// Préparation des données pour le graphique des dépenses par catégorie
const chartData = computed(() => {
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
  const labels = Object.keys(result);
  const values = Object.values(result);
  // Palette moderne
  const colors = [
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
  ];
  return {
    labels,
    values,
    colors: labels.map((_, i) => colors[i % colors.length]),
  };
});

// Modal pour ajout rapide de transaction
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

// Animation compteur sur le solde
const animatedBalance = ref(0);
watch(
  currentBalance,
  (newVal, oldVal) => {
    let start = oldVal ?? 0;
    let end = newVal;
    let duration = 700;
    let startTime = null;
    function animate(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      animatedBalance.value = start + (end - start) * progress;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animatedBalance.value = end;
      }
    }
    requestAnimationFrame(animate);
  },
  { immediate: true }
);

// Astuce budgétaire aléatoire
const tips = [
  "Notez toutes vos dépenses, même les plus petites.",
  "Fixez-vous un objectif d'épargne chaque mois.",
  "Comparez les prix avant chaque achat important.",
  "Évitez les achats impulsifs, attendez 24h avant de décider.",
  "Privilégiez les paiements en espèces pour mieux contrôler vos dépenses.",
  "Analysez vos abonnements et supprimez ceux que vous n'utilisez pas.",
  "Préparez vos repas à la maison pour économiser.",
  "Utilisez des listes de courses pour éviter les achats inutiles.",
  "Mettez de côté une petite somme dès que vous recevez un revenu.",
  "Révisez votre budget chaque semaine pour rester sur la bonne voie.",
  // Astuces humoristiques ajoutées
  "Si vous ne pouvez pas vous le permettre deux fois, vous ne pouvez pas vous le permettre du tout. (Même si ça coûte 2€)",
  'Mon banquier m\'a dit "vous avez un découvert". J\'ai dit "Merci, je l\'avais pas vu !".',
  "L'argent ne fait pas le bonheur... mais ça aide à payer les factures. Ce qui est une forme de bonheur.",
  "Ma stratégie d'épargne : je mets de l'argent de côté pour les jours de pluie. Jusqu'à présent, il n'a jamais plu assez fort.",
  "Investir dans des chaussettes : c'est le seul endroit où votre argent ne s'en va pas tout seul.",
  "Je n'ai pas un problème d'argent, j'ai un problème avec le prix des choses.",
  "Astuce : si vous avez faim, vérifiez d'abord votre frigo. C'est gratuit. Enfin, ça l'était.",
  "Règle numéro 1 de l'argent : ne perds jamais d'argent. Règle numéro 2 : n'oublie jamais la règle numéro 1.",
];
const tipOfTheDay = ref(tips[Math.floor(Math.random() * tips.length)]);

const isDark = ref(false);
function toggleDark() {
  isDark.value = !isDark.value;
  document.body.classList.toggle("dark", isDark.value);
}
</script>

<template>
  <div :class="{ dark: isDark }">
    <AppHeader @toggle-dark="toggleDark" />
    <div class="min-vh-100 bg-light py-4">
      <div class="container">
        <!-- En-tête -->
        <header class="text-center mb-5">
          <div
            class="d-flex justify-content-center align-items-center mb-4 gap-3"
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
          <p class="lead text-primary mb-3">Votre budget, votre liberté.</p>
          <p class="text-muted mb-4">
            Gérez facilement votre budget à plusieurs
          </p>

          <!-- Message de bienvenue personnalisé -->
          <div class="mt-0 mb-5" v-if="userStore.currentUser">
            <p class="h5 mb-0">
              Bienvenue,
              <span
                :style="{ color: userStore.currentUser.color }"
                class="fw-semibold"
                >{{ userStore.currentUser.name }}</span
              >
              !
            </p>
          </div>

          <!-- Sélecteur d'utilisateur -->
          <div class="btn-group mt-0" role="group">
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

        <!-- Première ligne : Solde et Formulaire d'ajout -->
        <div class="row g-4 mb-4">
          <!-- Carte de solde -->
          <div class="col-md-4">
            <div
              class="card h-100 shadow-sm w-100"
              style="max-width: 400px; margin: 0 auto"
            >
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
                      >{{ animatedBalance.toFixed(2) }}</span
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
                  <div
                    class="text-success d-flex flex-column align-items-center"
                  >
                    <i
                      class="bi bi-arrow-down-circle"
                      style="font-size: 1.5rem"
                    ></i>
                    <div class="small">Revenus</div>
                    <div class="fw-bold">+{{ currentIncome.toFixed(2) }} €</div>
                  </div>
                  <div
                    class="text-danger d-flex flex-column align-items-center"
                  >
                    <i
                      class="bi bi-arrow-up-circle"
                      style="font-size: 1.5rem"
                    ></i>
                    <div class="small">Dépenses</div>
                    <div class="fw-bold">
                      -{{ currentExpenses.toFixed(2) }} €
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Formulaire d'ajout -->
          <div class="col-md-8">
            <div class="card h-100 shadow-sm p-4">
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
                          <!-- <i class="bi me-2" :class="category.icon"></i> -->
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

        <!-- Ajout du dashboard graphique -->
        <div class="row g-4 mb-4">
          <div class="col-md-12">
            <div class="card p-4 h-100">
              <BudgetChart :data="chartData" />
            </div>
          </div>
        </div>

        <!-- Deuxième ligne : Graphiques -->
        <!-- <div class="row g-4 mb-4">
          <div class="col-md-12">
            <div class="card p-4 h-100">
              <canvas ref="chartRef" height="220"></canvas>
            </div>
          </div>
        </div> -->

        <!-- Troisième ligne : Astuce du jour et Résumé mensuel -->
        <div class="row g-4 mb-4 justify-content-center">
          <!-- Astuce du jour -->
          <div class="col-md-6">
            <div
              class="alert alert-info text-center h-100 d-flex flex-column justify-content-center mb-0"
              style="font-size: 1.05rem"
            >
              <i class="bi bi-lightbulb me-2"></i>
              <strong>Astuce du jour :</strong> {{ tipOfTheDay }}
            </div>
          </div>
          <!-- Résumé mensuel dynamique -->
          <div class="col-md-6">
            <div class="card p-4 text-center h-100 mb-0">
              <div
                class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"
              >
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="prevMonth"
                >
                  <i class="bi bi-chevron-left"></i>
                </button>
                <span class="fw-bold" style="font-size: 1.2rem"
                  >{{ monthNames[selectedMonth] }} {{ selectedYear }}</span
                >
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="nextMonth"
                >
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

        <!-- Quatrième ligne : Liste des transactions -->
        <div class="row mt-4">
          <div class="col-12">
            <div class="card shadow-sm">
              <div class="card-header bg-white py-3">
                <div
                  class="d-flex justify-content-between align-items-center flex-wrap gap-3"
                >
                  <div class="d-flex align-items-center gap-3">
                    <h2 class="h5 mb-0">
                      <i class="bi bi-list-ul me-2"></i>Historique des
                      transactions
                    </h2>
                    <!-- Badge de statistiques -->
                    <div class="d-flex gap-2">
                      <span class="badge bg-success bg-opacity-10 text-success">
                        <i class="bi bi-arrow-down-circle me-1"></i>
                        {{ filteredAndSortedIncomeTransactions.length }} revenus
                      </span>
                      <span class="badge bg-danger bg-opacity-10 text-danger">
                        <i class="bi bi-arrow-up-circle me-1"></i>
                        {{ filteredAndSortedExpenseTransactions.length }}
                        dépenses
                      </span>
                    </div>
                  </div>
                  <!-- Contrôles de recherche, filtrage et tri -->
                  <div class="d-flex gap-2 flex-wrap">
                    <!-- Barre de recherche -->
                    <div class="input-group" style="min-width: 200px">
                      <span class="input-group-text bg-light">
                        <i class="bi bi-search"></i>
                      </span>
                      <input
                        v-model="searchQuery"
                        type="text"
                        class="form-control"
                        placeholder="Rechercher une transaction..."
                      />
                    </div>
                    <!-- Filtres -->
                    <div class="dropdown">
                      <button
                        class="btn btn-outline-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        <i class="bi bi-funnel me-1"></i>Filtres
                      </button>
                      <div class="dropdown-menu p-3" style="width: 300px">
                        <h6 class="dropdown-header">Filtres</h6>
                        <div class="mb-3">
                          <label class="form-label small">Date</label>
                          <input
                            v-model="filterDate"
                            type="date"
                            class="form-control form-control-sm"
                          />
                        </div>
                        <div class="mb-3">
                          <label class="form-label small"
                            >Montant minimum</label
                          >
                          <div class="input-group input-group-sm">
                            <span class="input-group-text">€</span>
                            <input
                              v-model="filterAmount"
                              type="number"
                              class="form-control"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div class="mb-3">
                          <label class="form-label small">Catégorie</label>
                          <select
                            v-model="filterCategory"
                            class="form-select form-select-sm"
                          >
                            <option value="">Toutes catégories</option>
                            <option
                              v-for="category in transactionStore.categories"
                              :key="category.id"
                              :value="category.id"
                            >
                              {{ category.name }}
                            </option>
                          </select>
                        </div>
                        <div class="d-flex justify-content-between">
                          <button
                            @click="resetFiltersAndSort"
                            class="btn btn-sm btn-outline-secondary"
                          >
                            Réinitialiser
                          </button>
                          <button
                            class="btn btn-sm btn-primary"
                            data-bs-dismiss="dropdown"
                          >
                            Appliquer
                          </button>
                        </div>
                      </div>
                    </div>
                    <!-- Tri -->
                    <div class="dropdown">
                      <button
                        class="btn btn-outline-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        <i class="bi bi-sort-down me-1"></i>Trier
                      </button>
                      <div class="dropdown-menu p-3">
                        <h6 class="dropdown-header">Trier par</h6>
                        <div class="mb-3">
                          <select
                            v-model="sortBy"
                            class="form-select form-select-sm"
                          >
                            <option value="date">Date</option>
                            <option value="amount">Montant</option>
                            <option value="description">Description</option>
                            <option value="category">Catégorie</option>
                          </select>
                        </div>
                        <div class="mb-3">
                          <div class="form-check">
                            <input
                              v-model="sortOrder"
                              value="asc"
                              type="radio"
                              class="form-check-input"
                              id="sortAsc"
                            />
                            <label class="form-check-label" for="sortAsc">
                              Croissant
                            </label>
                          </div>
                          <div class="form-check">
                            <input
                              v-model="sortOrder"
                              value="desc"
                              type="radio"
                              class="form-check-input"
                              id="sortDesc"
                            />
                            <label class="form-check-label" for="sortDesc">
                              Décroissant
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-body p-0">
                <!-- État vide -->
                <div
                  v-if="filteredAndSortedTransactions.length === 0"
                  class="text-center py-5"
                >
                  <div class="text-muted">
                    <i class="bi bi-search fs-1 opacity-50"></i>
                    <p class="mt-2 mb-0">Aucune transaction trouvée</p>
                    <small class="text-muted"
                      >Essayez de modifier vos critères de recherche</small
                    >
                  </div>
                </div>
                <!-- Liste des transactions -->
                <div
                  v-if="
                    filteredAndSortedIncomeTransactions.length > 0 ||
                    filteredAndSortedExpenseTransactions.length > 0
                  "
                  class="transaction-list"
                >
                  <!-- Revenus -->
                  <div
                    v-if="filteredAndSortedIncomeTransactions.length > 0"
                    class="mb-4"
                  >
                    <div
                      class="bg-success bg-opacity-10 p-3 d-flex justify-content-between align-items-center"
                    >
                      <h6 class="text-success fw-semibold mb-0">
                        <i class="bi bi-arrow-down-circle me-2"></i>Revenus
                      </h6>
                      <span class="badge bg-success bg-opacity-25 text-success">
                        {{ filteredAndSortedIncomeTransactions.length }}
                      </span>
                    </div>
                    <ul class="list-group list-group-flush">
                      <transition-group name="fade" tag="div">
                        <li
                          v-for="transaction in filteredAndSortedIncomeTransactions"
                          :key="transaction.id"
                          class="list-group-item list-group-item-action"
                        >
                          <div class="d-flex align-items-center w-100">
                            <div
                              class="bg-success bg-opacity-10 text-success rounded-circle p-2 me-3"
                            >
                              <i class="bi bi-arrow-down-circle fs-5"></i>
                            </div>
                            <div class="flex-grow-1 me-3">
                              <div
                                class="d-flex align-items-center text-muted small gap-2"
                              >
                                <span
                                  class="badge bg-success bg-opacity-10 text-success"
                                >
                                  <i
                                    class="bi me-1"
                                    :class="
                                      transactionStore.getCategoryById(
                                        transaction.categoryId
                                      ).icon
                                    "
                                  ></i>
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
                            <div class="d-flex align-items-center gap-3">
                              <span class="text-success fw-bold"
                                >+{{ transaction.amount.toFixed(2) }} €</span
                              >
                              <button
                                @click="deleteTransaction(transaction.id)"
                                class="btn btn-sm btn-link text-muted p-0"
                                title="Supprimer"
                              >
                                <i class="bi bi-x-lg"></i>
                              </button>
                            </div>
                          </div>
                        </li>
                      </transition-group>
                    </ul>
                  </div>
                  <!-- Dépenses -->
                  <div v-if="filteredAndSortedExpenseTransactions.length > 0">
                    <div
                      class="bg-danger bg-opacity-10 p-3 d-flex justify-content-between align-items-center"
                    >
                      <h6 class="text-danger fw-semibold mb-0">
                        <i class="bi bi-arrow-up-circle me-2"></i>Dépenses
                      </h6>
                      <span class="badge bg-danger bg-opacity-25 text-danger">
                        {{ filteredAndSortedExpenseTransactions.length }}
                      </span>
                    </div>
                    <ul class="list-group list-group-flush">
                      <transition-group name="fade" tag="div">
                        <li
                          v-for="transaction in filteredAndSortedExpenseTransactions"
                          :key="transaction.id"
                          class="list-group-item list-group-item-action"
                        >
                          <div class="d-flex align-items-center w-100">
                            <div
                              class="bg-danger bg-opacity-10 text-danger rounded-circle p-2 me-3"
                            >
                              <i class="bi bi-arrow-up-circle fs-5"></i>
                            </div>
                            <div class="flex-grow-1 me-3">
                              <div
                                class="d-flex align-items-center text-muted small gap-2"
                              >
                                <span
                                  class="badge bg-danger bg-opacity-10 text-danger"
                                >
                                  <i
                                    class="bi me-1"
                                    :class="
                                      transactionStore.getCategoryById(
                                        transaction.categoryId
                                      ).icon
                                    "
                                  ></i>
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
                            <div class="d-flex align-items-center gap-3">
                              <span class="text-danger fw-bold"
                                >-{{ transaction.amount.toFixed(2) }} €</span
                              >
                              <button
                                @click="deleteTransaction(transaction.id)"
                                class="btn btn-sm btn-link text-muted p-0"
                                title="Supprimer"
                              >
                                <i class="bi bi-x-lg"></i>
                              </button>
                            </div>
                          </div>
                        </li>
                      </transition-group>
                    </ul>
                  </div>
                </div>
              </div>
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
    <!-- Bouton flottant d'ajout rapide -->
    <button class="fab" @click="openModal">
      <i class="bi bi-plus-lg"></i>
    </button>
    <!-- Modale d'ajout rapide -->
    <div
      v-if="showModal"
      class="modal-backdrop-custom"
      @click.self="closeModal"
    >
      <div class="modal-custom card p-4">
        <button
          class="btn-close ms-auto mb-2"
          @click="closeModal"
          aria-label="Fermer"
        ></button>
        <h2 class="h5 fw-semibold mb-4">Nouvelle transaction</h2>
        <form
          @submit.prevent="
            addTransaction;
            closeModal();
          "
        >
          <div class="row g-3">
            <div class="col-12">
              <label for="description-modal" class="form-label"
                >Description</label
              >
              <input
                v-model="newTransaction.description"
                type="text"
                id="description-modal"
                class="form-control"
                placeholder="Ex: Courses du week-end"
                required
              />
            </div>
            <div class="col-12">
              <label for="amount-modal" class="form-label">Montant (€)</label>
              <div class="input-group">
                <span class="input-group-text">€</span>
                <input
                  v-model="newTransaction.amount"
                  type="number"
                  step="0.01"
                  id="amount-modal"
                  class="form-control"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div class="col-12">
              <label for="type-modal" class="form-label">Type</label>
              <select
                v-model="newTransaction.type"
                id="type-modal"
                class="form-select"
              >
                <option value="expense">Dépense</option>
                <option value="income">Revenu</option>
              </select>
            </div>
            <div class="col-12">
              <label for="category-modal" class="form-label">Catégorie</label>
              <select
                v-model="newTransaction.categoryId"
                id="category-modal"
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
                <i class="bi bi-plus-circle me-2"></i>Ajouter la transaction
              </button>
            </div>
          </div>
        </form>
      </div>
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
.transaction-list {
  max-height: 600px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.transaction-list::-webkit-scrollbar {
  width: 6px;
}

.transaction-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.transaction-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.transaction-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.list-group-item {
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.list-group-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.badge {
  font-weight: 500;
  padding: 0.5em 0.8em;
}

.dropdown-menu {
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Styles pour améliorer l'alignement à l'intérieur de chaque transaction */
.list-group-item .d-flex.align-items-center.w-100 {
  align-items: center;
}

.list-group-item .flex-grow-1 {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-right: 1rem;
}

.list-group-item h6 {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.2;
}

.list-group-item .d-flex.align-items-center.text-muted.small.gap-2 {
  align-items: center;
  margin-top: 0.1rem;
  margin-bottom: 0 !important;
  padding: 0 !important;
}

.list-group-item .rounded-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.list-group-item .gap-3.ms-auto {
  display: flex;
  align-items: center;
}

/* Styles pour le mode sombre */
.dark {
  background-color: #121212;
  color: #e0e0e0;
}

.dark .card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.dark .btn {
  background-color: #1e1e1e;
  color: #ffffff;
}

.dark .btn:hover {
  background-color: #2c2c2c;
}

.dark .list-group-item {
  background-color: #1e1e1e;
  border-color: #333;
}

.dark .badge {
  background-color: #333;
  color: #fff;
}

.dark .dropdown-menu {
  background-color: #1e1e1e;
  border-color: #333;
}

.dark .form-control {
  background-color: #2c2c2c;
  color: #fff;
  border: 1px solid #444;
}

.dark .form-control:focus {
  background-color: #333;
  border-color: #007bff;
}

.dark .alert {
  background-color: #333;
  color: #fff;
  border-color: #444;
}

/* Modale d'ajout rapide */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-custom {
  max-width: 400px;
  width: 100%;
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  background: #fff;
  position: relative;
}
.dark .modal-custom {
  background: #23232b;
  color: #fff;
}
.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
}
.btn-close:hover {
  color: #e11d48;
}
</style>
