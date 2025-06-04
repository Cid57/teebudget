<script setup>
import { ref, onMounted, computed, onBeforeMount } from "vue";
import { useTransactionStore } from "./stores/useTransactionStore.js";
import { useUserStore } from "./stores/useUserStore.js";

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

// Ajouter une transaction pour l'utilisateur courant
const addTransaction = () => {
  if (!newTransaction.value.description || !newTransaction.value.amount) return;

  transactionStore.addTransaction(userStore.currentUserId, {
    ...newTransaction.value,
    amount: parseFloat(newTransaction.value.amount),
  });

  // Réinitialiser le formulaire
  newTransaction.value = {
    description: "",
    amount: "",
    type: "expense",
    categoryId: 1,
  };
};

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
</script>

<template>
  <div class="min-vh-100 bg-light py-4">
    <div class="container">
      <!-- En-tête -->
      <header class="text-center mb-5">
        <div class="d-flex justify-content-center mb-3">
          <div
            :style="{ backgroundColor: userStore.currentUser.color }"
            class="text-white p-3 rounded-3 shadow-sm"
          >
            <i class="bi bi-people-fill fs-4"></i>
          </div>
        </div>
        <h1 class="display-5 fw-bold mb-2">TeeBudget</h1>
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
        <!-- Carte de solde -->
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <h2 class="h6 text-muted mb-0">
                  Solde de {{ userStore.currentUser.name }}
                </h2>
                <i
                  class="bi bi-person-circle"
                  :style="{ color: userStore.currentUser.color }"
                ></i>
              </div>
              <div
                class="display-6 fw-bold mb-1"
                :class="{
                  'text-success': currentBalance >= 0,
                  'text-danger': currentBalance < 0,
                }"
              >
                {{ currentBalance.toFixed(2) }} €
              </div>
              <div class="d-flex justify-content-between mt-3">
                <div class="text-success">
                  <div class="small">Revenus</div>
                  <div class="fw-bold">+{{ currentIncome.toFixed(2) }} €</div>
                </div>
                <div class="text-danger">
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
                    <li
                      v-for="transaction in incomeTransactions"
                      :key="transaction.id"
                      class="list-group-item list-group-item-action"
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
                            <h6 class="mb-0">{{ transaction.description }}</h6>
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
                    <li
                      v-for="transaction in expenseTransactions"
                      :key="transaction.id"
                      class="list-group-item list-group-item-action"
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
                            <h6 class="mb-0">{{ transaction.description }}</h6>
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
    </div>
  </div>
</template>

<style scoped>
/* Les styles sont maintenant gérés par Tailwind CSS */
</style>
