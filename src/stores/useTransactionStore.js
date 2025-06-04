import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useUserStore } from "./useUserStore.js";

export const useTransactionStore = defineStore("transactions", () => {
  // Transactions par utilisateur
  const transactions = ref(
    JSON.parse(localStorage.getItem("transactions")) || {}
  );

  const categories = [
    { id: 1, name: "Alimentation", type: "expense" },
    { id: 2, name: "Loyer", type: "expense" },
    { id: 3, name: "Loisirs", type: "expense" },
    { id: 4, name: "Salaire", type: "income" },
    { id: 5, name: "Autre revenu", type: "income" },
  ];

  const transactionTypes = [
    { id: "expense", name: "Dépense" },
    { id: "income", name: "Revenu" },
  ];

  // Initialiser les transactions pour un nouvel utilisateur si nécessaire
  const initUserTransactions = (userId) => {
    if (!transactions.value[userId]) {
      transactions.value[userId] = [];
      saveToLocalStorage();
    }
  };

  // Obtenir les transactions de l'utilisateur courant
  const getUserTransactions = (userId) => {
    return transactions.value[userId] || [];
  };

  const addTransaction = (userId, transaction) => {
    if (!transactions.value[userId]) {
      transactions.value[userId] = [];
    }

    const newTransaction = {
      id: Date.now(),
      ...transaction,
      date: new Date().toISOString(),
    };

    transactions.value[userId].push(newTransaction);
    saveToLocalStorage();
    return newTransaction;
  };

  const deleteTransaction = (userId, transactionId) => {
    if (transactions.value[userId]) {
      transactions.value[userId] = transactions.value[userId].filter(
        (t) => t.id !== transactionId
      );
      saveToLocalStorage();
    }
  };

  const saveToLocalStorage = () => {
    localStorage.setItem("transactions", JSON.stringify(transactions.value));
  };

  const getTransactions = (userId) => {
    return transactions.value[userId] || [];
  };

  const totalBalance = computed(() => (userId) => {
    const userTransactions = getTransactions(userId);
    return userTransactions.reduce((sum, transaction) => {
      return transaction.type === "income"
        ? sum + transaction.amount
        : sum - transaction.amount;
    }, 0);
  });

  const totalIncome = computed(() => (userId) => {
    const userTransactions = getTransactions(userId);
    return userTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  });

  const totalExpenses = computed(() => (userId) => {
    const userTransactions = getTransactions(userId);
    return userTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  });

  const getTransactionsByType = (userId, type) => {
    const userTransactions = getTransactions(userId);
    return userTransactions
      .filter((t) => t.type === type)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getCategoryById = (id) => {
    return categories.find((cat) => cat.id === id) || { name: "Inconnue" };
  };

  // Initialiser le store
  const init = async () => {
    return new Promise((resolve) => {
      console.log("Initialisation du TransactionStore...");
      // S'assurer que tous les utilisateurs ont un tableau de transactions
      const userStore = useUserStore();
      console.log("Utilisateurs trouvés:", userStore.users);

      userStore.users.forEach((user) => {
        if (!transactions.value[user.id]) {
          transactions.value[user.id] = [];
          console.log(
            `Tableau de transactions initialisé pour l'utilisateur ${user.name} (ID: ${user.id})`
          );
        } else {
          console.log(
            `Transactions existantes pour l'utilisateur ${user.name}:`,
            transactions.value[user.id].length
          );
        }
      });

      saveToLocalStorage();
      console.log("TransactionStore initialisé avec succès");
      resolve();
    });
  };

  return {
    categories,
    transactionTypes,
    init,
    initUserTransactions,
    getUserTransactions,
    getTransactions,
    addTransaction,
    deleteTransaction,
    totalBalance,
    totalIncome,
    totalExpenses,
    getTransactionsByType,
    getCategoryById,
  };
});
