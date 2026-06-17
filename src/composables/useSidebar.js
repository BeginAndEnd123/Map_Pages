import { ref } from 'vue'

let _instance = null

export function useSidebar() {
  if (_instance) return _instance

  const sidebarOpen = ref(window.innerWidth > 768)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  _instance = { sidebarOpen, toggleSidebar, closeSidebar, openSidebar }
  return _instance
}
