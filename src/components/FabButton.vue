<template>
  <button class="fab" @click="$emit('add')">
    <i class="bi bi-plus-lg"></i>
  </button>
</template>

<script setup>
// Pas de logique JS nécessaire, tout est géré par l'événement
</script>

<style scoped>
.fab {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  font-size: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: none;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.fab:hover {
  background: #1d4ed8;
}
</style>
