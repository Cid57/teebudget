import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';

const app = createApp(App);

// Pinia
const pinia = createPinia();
app.use(pinia);

app.mount('#app');
