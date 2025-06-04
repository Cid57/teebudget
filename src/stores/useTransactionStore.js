import { defineStore } from 'pinia';

export const useTransactionStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    categories: [
      { id: 1, name: 'Alimentation', type: 'expense', color: 'bg-red-100 text-red-800' },
      { id: 2, name: 'Loyer', type: 'expense', color: 'bg-blue-100 text-blue-800' },
      { id: 3, name: 'Salaire', type: 'income', color: 'bg-green-100 text-green-800' },
      { id: 4, name: 'Loisirs', type: 'expense', color: 'bg-yellow-100 text-yellow-800' },
      { id: 5, name: 'Autre', type: 'expense', color: 'bg-gray-100 text-gray-800' },
    ],
  }),
  
  getters: {
    getTransactions: (state) => state.transactions,
    getCategories: (state) => state.categories,
    getBalance: (state) => {
      return state.transactions.reduce((total, transaction) => {
        return transaction.type === 'income' 
          ? total + transaction.amount 
          : total - transaction.amount;
      }, 0);
    },
    getTransactionsByCategory: (state) => (categoryId) => {
      return state.transactions.filter(t => t.categoryId === categoryId);
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
      if (saved) {
        this.transactions = JSON.parse(saved);
      }
    },
    
    saveToLocalStorage() {
      localStorage.setItem('transactions', JSON.stringify(this.transactions));
    },
  },
});
