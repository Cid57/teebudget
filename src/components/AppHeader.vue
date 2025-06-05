<template>
  <header
    class="app-header d-flex justify-content-between align-items-center py-3 mb-4"
  >
    <div class="d-flex align-items-center gap-2">
      <i class="bi bi-wallet2 fs-2 text-primary"></i>
      <span class="fw-bold fs-4">TeeBudget</span>
    </div>
    <button class="theme-switch" @click="$emit('toggle-dark')">🌙</button>
  </header>
</template>

<script setup>
// Pas de logique JS, tout est dans l'émission d'événement
</script>

<style scoped>
.app-header {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 1rem;
  box-shadow: 0 2px 8px #0001;
  padding-left: 2rem;
  padding-right: 2rem;
}
.theme-switch {
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.3rem;
  border: none;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.theme-switch:hover {
  background: #1d4ed8;
}
</style>
