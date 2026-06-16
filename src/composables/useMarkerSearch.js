/**
 * useMarkerSearch — 标记搜索（静态数据版）
 */
import { ref } from 'vue'
import { loadMarkers } from '../data/loader'

export function useMarkerSearch() {
  const keyword = ref('')
  const showSearchResults = ref(false)
  const searchResults = ref([])
  let searchDebounce = null
  let blurTimer = null

  async function onSearchInput() {
    showSearchResults.value = true
    if (!keyword.value) {
      searchResults.value = []
      return
    }
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(async () => {
      try {
        const all = await loadMarkers()
        const kw = keyword.value.toLowerCase()
        searchResults.value = all.filter(m =>
          m.name && m.name.toLowerCase().includes(kw)
        )
      } catch {
        searchResults.value = []
      }
    }, 300)
  }

  function onSearchBlur() {
    if (blurTimer) clearTimeout(blurTimer)
    blurTimer = setTimeout(() => { showSearchResults.value = false }, 200)
  }

  function onSearchSelect(marker, switchToRegionFn) {
    showSearchResults.value = false
    if (marker.region_id && switchToRegionFn) {
      switchToRegionFn(marker.region_id, marker.map_name, marker.x_coord, marker.y_coord)
    }
    return marker
  }

  function cleanup() {
    if (searchDebounce) clearTimeout(searchDebounce)
    if (blurTimer) clearTimeout(blurTimer)
  }

  return {
    keyword, showSearchResults, searchResults,
    onSearchInput, onSearchBlur, onSearchSelect, cleanup,
  }
}
