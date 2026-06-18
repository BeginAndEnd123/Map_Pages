<template>
  <div class="side-panel" :class="{ open: modelValue, mobile: isMobile }">
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  modelValue: { type: Boolean, default: true }
})

const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.side-panel {
  width: 280px; min-width: 280px;
  background: linear-gradient(180deg, #141425 0%, #0e0e1d 100%);
  padding: 18px 16px;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  box-shadow: 3px 0 30px rgba(0,0,0,0.4), inset -1px 0 0 rgba(200,164,78,0.04);
  display: flex; flex-direction: column; gap: 2px;
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .side-panel {
    position: fixed; left: 0; top: calc(44px + env(safe-area-inset-top)); bottom: 0; z-index: 400;
    width: 280px; min-width: 280px;
    padding-bottom: env(safe-area-inset-bottom);
    transform: translateX(-100%);
  }
  .side-panel.open { transform: translateX(0); }
}
</style>
