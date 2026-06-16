/**
 * useRecentMarkers — 最新标记列表 + 分页（静态数据版）
 */
import { ref, computed } from 'vue'
import { loadMarkers } from '../data/loader'

export function useRecentMarkers(pageSize = 5) {
  const recentMarkers = ref([])
  const recentPage = ref(1)
  const recentTotal = ref(0)
  const gotoPage = ref(1)

  const recentTotalPages = computed(() => Math.ceil(recentTotal.value / pageSize))

  const recentPages = computed(() => {
    const total = recentTotalPages.value
    const cur = recentPage.value
    const pages = []
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i)
      return pages
    }
    if (cur <= 3) {
      pages.push(1); pages.push(2); pages.push(3); pages.push(4)
      pages.push('…')
      pages.push(total)
    } else if (cur >= total - 2) {
      pages.push(1)
      pages.push('…')
      for (let i = total - 3; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('…')
      pages.push(cur - 1)
      pages.push(cur)
      pages.push(cur + 1)
      pages.push('…')
      pages.push(total)
    }
    return pages
  })

  async function fetchRecentMarkers() {
    try {
      const all = await loadMarkers()
      const sorted = [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      recentTotal.value = sorted.length
      const offset = (recentPage.value - 1) * pageSize
      recentMarkers.value = sorted.slice(offset, offset + pageSize)
    } catch {
      console.error('加载最新标记失败')
    }
  }

  function onRecentPage(page) {
    recentPage.value = page
    gotoPage.value = page
    fetchRecentMarkers()
  }

  function onGotoPage() {
    const max = recentTotalPages.value
    let p = Number(gotoPage.value)
    if (isNaN(p) || p < 1) p = 1
    if (p > max) p = max
    if (p !== recentPage.value) onRecentPage(p)
  }

  return {
    recentMarkers, recentPage, recentTotal, recentTotalPages,
    recentPages, gotoPage,
    fetchRecentMarkers, onRecentPage, onGotoPage,
  }
}
