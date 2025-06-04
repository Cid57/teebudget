<script setup>
import { ref, onMounted } from 'vue';
import { useTransactionStore } from './stores';

const transactionStore = useTransactionStore();
const newTransaction = ref({
  description: '',
  amount: '',
  type: 'expense',
  categoryId: 1
});

const addTransaction = () => {
  if (!newTransaction.value.description || !newTransaction.value.amount) return;
  
  transactionStore.addTransaction({
    ...newTransaction.value,
    amount: parseFloat(newTransaction.value.amount)
  });
  
  // Réinitialiser le formulaire
  newTransaction.value = {
    description: '',
    amount: '',
    type: 'expense',
    categoryId: 1
  };
};

const removeTransaction = (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
    transactionStore.removeTransaction(id);
  }
};

// Charger les transactions au démarrage
onMounted(() => {
  transactionStore.loadFromLocalStorage();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- En-tête -->
      <header class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900">TeeBudget</h1>
        <p class="text-gray-600">Gérez facilement votre budget personnel</p>
      </header>

      <!-- Carte de solde -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 class="text-lg font-medium text-gray-500 mb-1">Solde actuel</h2>
        <div class="text-4xl font-bold" :class="{ 'text-green-600': transactionStore.getBalance >= 0, 'text-red-600': transactionStore.getBalance < 0 }">
          {{ transactionStore.getBalance.toFixed(2) }} €
        </div>
      </div>

      <!-- Formulaire d'ajout -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 class="text-lg font-medium text-gray-700 mb-4">Ajouter une transaction</h2>
        <form @submit.prevent="addTransaction" class="space-y-4">
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              id="description"
              v-model="newTransaction.description"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            >
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="amount" class="block text-sm font-medium text-gray-700">Montant (€)</label>
              <input
                type="number"
                step="0.01"
                id="amount"
                v-model="newTransaction.amount"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
            </div>
            
            <div>
              <label for="type" class="block text-sm font-medium text-gray-700">Type</label>
              <select
                id="type"
                v-model="newTransaction.type"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="expense">Dépense</option>
                <option value="income">Revenu</option>
              </select>
            </div>
          </div>
          
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700">Catégorie</label>
            <select
              id="category"
              v-model="newTransaction.categoryId"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option v-for="category in transactionStore.getCategories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Ajouter la transaction
          </button>
        </form>
      </div>

      <!-- Liste des transactions -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <div class="p-6">
          <h2 class="text-lg font-medium text-gray-700 mb-4">Historique des transactions</h2>
          
          <div v-if="transactionStore.getTransactions.length === 0" class="text-center py-8 text-gray-500">
            Aucune transaction enregistrée
          </div>
          
          <ul v-else class="divide-y divide-gray-200">
            <li v-for="transaction in transactionStore.getTransactions" :key="transaction.id" class="py-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div 
                    class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    :class="transactionStore.getCategories.find(c => c.id === transaction.categoryId)?.color + ' bg-opacity-30'"
                  >
                    {{ transaction.description.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ transaction.description }}</p>
                    <p class="text-xs text-gray-500">
                      {{ new Date(transaction.date).toLocaleDateString() }} • 
                      {{ transactionStore.getCategories.find(c => c.id === transaction.categoryId)?.name }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center">
                  <span 
                    class="font-medium" 
                    :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ transaction.amount.toFixed(2) }} €
                  </span>
                  <button 
                    @click="removeTransaction(transaction.id)"
                    class="ml-4 text-gray-400 hover:text-red-500 focus:outline-none"
                    title="Supprimer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Les styles sont maintenant gérés par Tailwind CSS */
</style>
