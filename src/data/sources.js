const CHAPTER_KEYS = ['chapter0', 'chapter1', 'chapter2', 'chapter3', 'chapter4']
const CHAPTER_NAMES = { chapter0: '序章', chapter1: '第1章', chapter2: '第1.5章', chapter3: '第2章', chapter4: '第3章' }
const BASE = import.meta.env.BASE_URL

let _regionsCache = null
let _categoriesCache = null
let _markersCache = null
let _mapsIndexCache = null

async function fetchJSON(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json()
}

async function loadRegions() {
  if (_regionsCache) return [..._regionsCache]
  _regionsCache = await fetchJSON(BASE + 'data/regions.json')
  return [..._regionsCache]
}

async function loadCategories() {
  if (_categoriesCache) return [..._categoriesCache]
  const json = await fetchJSON(BASE + 'data/categories.json')
  _categoriesCache = json.map(c => ({
    ...c,
    icon: c.icon && c.icon.startsWith('/icons/') ? BASE + c.icon.slice(1) : c.icon
  }))
  return [..._categoriesCache]
}

async function loadMarkers() {
  if (_markersCache) return [..._markersCache]
  _markersCache = await fetchJSON(BASE + 'data/markers.json')
  return [..._markersCache]
}

async function loadMapsIndex() {
  if (_mapsIndexCache) return _mapsIndexCache
  _mapsIndexCache = await fetchJSON(BASE + 'data/maps_index.json')
  return _mapsIndexCache
}

function getChapterKey(sortOrder) {
  return CHAPTER_KEYS[sortOrder] || ''
}

function getChapterName(chapterKey) {
  return CHAPTER_NAMES[chapterKey] || chapterKey
}

function getMapsForChapter(chapterKey, mapsIndex) {
  if (!mapsIndex || !mapsIndex[chapterKey]) return []
  const maps = mapsIndex[chapterKey].maps || []
  return maps.map(m => ({
    ...m,
    tile_url: m.tile_url ? m.tile_url.replace(/^\/TileMap\//, BASE + 'TileMap/') : m.tile_url
  }))
}

function clearCaches() {
  _regionsCache = null
  _categoriesCache = null
  _markersCache = null
  _mapsIndexCache = null
}

export {
  CHAPTER_KEYS,
  CHAPTER_NAMES,
  BASE,
  loadRegions,
  loadCategories,
  loadMarkers,
  loadMapsIndex,
  getChapterKey,
  getChapterName,
  getMapsForChapter,
  clearCaches,
}
