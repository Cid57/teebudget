import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  // Liste des utilisateurs
  const users = ref([
    { id: 1, name: 'Cindy', color: '#4f46e5' }, // Indigo
    { id: 2, name: 'Clémence', color: '#10b981' } // Emerald
  ]);
  
  // Utilisateur actif
  const currentUserId = ref(1); // Par défaut, Cindy est sélectionnée
  
  // Getter pour l'utilisateur actif
  const currentUser = computed(() => 
    users.value.find(user => user.id === currentUserId.value) || users.value[0]
  );
  
  // Changer d'utilisateur
  function setCurrentUser(userId) {
    currentUserId.value = userId;
    // Sauvegarder dans le localStorage
    localStorage.setItem('currentUserId', userId);
  }
  
  // Initialiser depuis le localStorage
  async function init() {
    return new Promise((resolve) => {
      console.log('Initialisation du UserStore...');
      const savedUserId = localStorage.getItem('currentUserId');
      if (savedUserId) {
        currentUserId.value = parseInt(savedUserId);
      }
      console.log('UserStore initialisé avec currentUserId:', currentUserId.value);
      resolve();
    });
  }
  
  return {
    users,
    currentUser,
    currentUserId,
    setCurrentUser,
    init
  };
});
