<template>
  <div>
    <canvas ref="chartRef" height="220"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import Chart from "chart.js/auto";
const props = defineProps({
  data: Object, // { labels: [], values: [], colors: [] }
});
const chartRef = ref(null);
let chartInstance = null;

function renderChart() {
  if (!chartRef.value) return;
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(chartRef.value, {
    type: "doughnut",
    data: {
      labels: props.data.labels,
      datasets: [
        {
          data: props.data.values,
          backgroundColor: props.data.colors,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: true, position: "bottom" },
        title: {
          display: true,
          text: "Dépenses par catégorie",
          font: { size: 18 },
        },
      },
    },
  });
}
onMounted(renderChart);
watch(() => props.data, renderChart, { deep: true });
</script>

<style scoped>
div {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
</style>
