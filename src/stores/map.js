/**
 * 地图数据状态管理 (Pinia) — 静态数据 + localStorage
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  loadRegions, loadCategories, loadMarkers,
  loadMapsIndex, getChapterKey, getMapsForChapter,
  localAddMarker, localUpdateMarker, localDeleteMarker,
} from '../data/loader'

export const CHAPTER_KEYS = ['chapter0', 'chapter1', 'chapter2', 'chapter3', 'chapter4']

export const useMapStore = defineStore('map', () => {
  const regions = ref([])
  const categories = ref([])
  const markers = ref([])
  const maps = ref([])
  const currentRegion = ref(null)
  const currentMap = ref(null)
  let mapsIndex = null

  async function fetchRegions() {
    try {
      regions.value = await loadRegions()
      if (!currentRegion.value && regions.value.length > 0) {
        currentRegion.value = regions.value[0]
      }
    } catch (e) {
      console.error('获取区域列表失败:', e)
    }
  }

  async function fetchCategories() {
    try {
      categories.value = await loadCategories()
    } catch (e) {
      console.error('获取分类列表失败:', e)
    }
  }

  async function fetchMarkers(params = {}) {
    try {
      const all = await loadMarkers()
      let filtered = [...all]
      if (params.region_id) {
        filtered = filtered.filter(m => m.region_id == params.region_id)
      }
      if (params.map_name) {
        filtered = filtered.filter(m => m.map_name === params.map_name)
      }
      if (params.category_id) {
        const ids = String(params.category_id).split(',').map(Number)
        filtered = filtered.filter(m => ids.includes(m.category_id))
      }
      if (params.sort_by === 'created_at') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }
      if (params.limit) {
        const offset = params.offset || 0
        filtered = filtered.slice(offset, offset + params.limit)
      }
      markers.value = filtered
    } catch (e) {
      console.error('获取标记列表失败:', e)
    }
  }

  async function fetchMaps(chapterKey) {
    if (!mapsIndex) {
      mapsIndex = await loadMapsIndex()
    }
    maps.value = getMapsForChapter(chapterKey, mapsIndex)
    return maps.value
  }

  function setRegion(region) {
    currentRegion.value = region
    currentMap.value = null
    maps.value = []
  }

  function setMap(mapItem) {
    currentMap.value = mapItem
  }

  function getChapterKeyLocal(regionSortOrder) {
    return getChapterKey(regionSortOrder)
  }

  // ── 标记 CRUD (localStorage) ──
  async function addMarker(data) {
    const item = localAddMarker(data)
    markers.value = [...markers.value, item]
    return item
  }

  async function editMarker(id, data) {
    const item = localUpdateMarker(id, data)
    markers.value = markers.value.map(m => m.id === id ? { ...m, ...item } : m)
    return item
  }

  async function removeMarker(id) {
    localDeleteMarker(id)
    markers.value = markers.value.filter(m => m.id !== id)
  }

  function filterMarkers(predicate) {
    markers.value = markers.value.filter(predicate)
  }

  function mergeMarkers(list) {
    const existingIds = new Set(markers.value.map(m => m.id))
    const added = list.filter(m => !existingIds.has(m.id))
    if (added.length > 0) {
      markers.value = [...markers.value, ...added]
    }
  }

  function setMarkers(list) {
    markers.value = list
  }

  return {
    regions, categories, markers, maps, currentRegion, currentMap,
    fetchRegions, fetchCategories, fetchMarkers, setRegion, setMap,
    addMarker, editMarker, removeMarker, getChapterKey: getChapterKeyLocal,
    filterMarkers, mergeMarkers, setMarkers, fetchMaps,
  }
})
