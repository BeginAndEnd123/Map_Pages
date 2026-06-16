/**
 * 静态数据加载 + localStorage 合并引擎
 *
 * JSON 是预置种子数据，localStorage 存储管理员本地修改。
 * 合并策略：localStorage 优先覆盖 JSON 数据。
 */
const CHAPTER_KEYS = ['chapter0', 'chapter1', 'chapter2', 'chapter3', 'chapter4']
const CHAPTER_NAMES = { chapter0: '序章', chapter1: '第1章', chapter2: '第1.5章', chapter3: '第2章', chapter4: '第3章' }
const BASE = import.meta.env.BASE_URL

const STORAGE_KEYS = {
  regions: 'bg3_local_regions',
  categories: 'bg3_local_categories',
  markers: 'bg3_local_markers',
  admin: 'bg3_admin_auth',
  adminUser: 'bg3_admin_user'
}

let _regionsCache = null
let _categoriesCache = null
let _markersCache = null
let _mapsIndexCache = null

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

async function fetchJSON(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json()
}

async function loadRegions() {
  if (_regionsCache) return [..._regionsCache]
  const json = await fetchJSON(BASE + 'data/regions.json')
  const local = readLocal(STORAGE_KEYS.regions) || []
  const merged = mergeArrays(json, local, 'id')
  _regionsCache = merged
  return [...merged]
}

async function loadCategories() {
  if (_categoriesCache) return [..._categoriesCache]
  const json = await fetchJSON(BASE + 'data/categories.json')
  const fixed = json.map(c => ({
    ...c,
    icon: c.icon && c.icon.startsWith('/icons/') ? BASE + c.icon.slice(1) : c.icon
  }))
  const local = readLocal(STORAGE_KEYS.categories) || []
  const merged = mergeArrays(fixed, local, 'id')
  _categoriesCache = merged
  return [...merged]
}

async function loadMarkers() {
  if (_markersCache) return [..._markersCache]
  const json = await fetchJSON(BASE + 'data/markers.json')
  const local = readLocal(STORAGE_KEYS.markers) || []
  const merged = mergeArrays(json, local, 'id')
  _markersCache = merged
  return [...merged]
}

async function loadMapsIndex() {
  if (_mapsIndexCache) return _mapsIndexCache
  _mapsIndexCache = await fetchJSON(BASE + 'data/maps_index.json')
  return _mapsIndexCache
}

function mergeArrays(jsonArr, localArr, idKey) {
  const map = {}
  const deleted = new Set(
    localArr.filter(item => item._deleted).map(item => item[idKey])
  )

  jsonArr.forEach(item => {
    if (!deleted.has(item[idKey])) {
      map[item[idKey]] = item
    }
  })

  localArr.forEach(item => {
    if (!item._deleted && !deleted.has(item[idKey])) {
      map[item[idKey]] = item
    }
  })

  return Object.values(map)
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

// ── 管理员认证 ──
const ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function adminLogin(password) {
  const hash = await sha256(password)
  if (hash === ADMIN_PASSWORD_HASH) {
    writeLocal(STORAGE_KEYS.admin, 'true')
    writeLocal(STORAGE_KEYS.adminUser, { username: 'admin', is_admin: true })
    return true
  }
  return false
}

function adminLogout() {
  localStorage.removeItem(STORAGE_KEYS.admin)
  localStorage.removeItem(STORAGE_KEYS.adminUser)
}

function isAdminLoggedIn() {
  return readLocal(STORAGE_KEYS.admin) === 'true'
}

function getAdminUser() {
  const raw = readLocal(STORAGE_KEYS.adminUser)
  return raw || null
}

// ── 本地 CRUD ──
function _nextId(items) {
  if (items.length === 0) return 1
  return Math.max(...items.map(i => i.id)) + 1
}

function localAddRegion(region) {
  const local = readLocal(STORAGE_KEYS.regions) || []
  const newId = _nextId([...local, ..._regionsCache || []])
  const item = { ...region, id: newId, sort_order: local.length + 10 }
  local.push(item)
  writeLocal(STORAGE_KEYS.regions, local)
  _regionsCache = null
  return item
}

function localUpdateRegion(id, data) {
  const local = readLocal(STORAGE_KEYS.regions) || []
  let found = local.find(r => r.id === id)
  if (found) {
    Object.assign(found, data)
  } else {
    found = { ...data, id }
    local.push(found)
  }
  writeLocal(STORAGE_KEYS.regions, local)
  _regionsCache = null
  return found
}

function localDeleteRegion(id) {
  const local = readLocal(STORAGE_KEYS.regions) || []
  const cleaned = local.filter(r => r.id !== id)
  cleaned.push({ id, _deleted: true })
  writeLocal(STORAGE_KEYS.regions, cleaned)
  _regionsCache = null
}

// ── 分类本地 CRUD ──
function localAddCategory(cat) {
  const local = readLocal(STORAGE_KEYS.categories) || []
  const newId = _nextId([...local, ..._categoriesCache || []])
  const item = { ...cat, id: newId, sort_order: local.length + 10 }
  local.push(item)
  writeLocal(STORAGE_KEYS.categories, local)
  _categoriesCache = null
  return item
}

function localUpdateCategory(id, data) {
  const local = readLocal(STORAGE_KEYS.categories) || []
  let found = local.find(c => c.id === id)
  if (found) {
    Object.assign(found, data)
  } else {
    found = { ...data, id }
    local.push(found)
  }
  writeLocal(STORAGE_KEYS.categories, local)
  _categoriesCache = null
  return found
}

function localDeleteCategory(id) {
  const local = readLocal(STORAGE_KEYS.categories) || []
  const cleaned = local.filter(c => c.id !== id)
  cleaned.push({ id, _deleted: true })
  writeLocal(STORAGE_KEYS.categories, cleaned)
  _categoriesCache = null
}

// ── 标记本地 CRUD ──
function localAddMarker(marker) {
  const local = readLocal(STORAGE_KEYS.markers) || []
  const newId = _nextId([...local, ..._markersCache || []])
  const item = {
    ...marker,
    id: newId,
    status: 'approved',
    created_at: new Date().toISOString()
  }
  local.push(item)
  writeLocal(STORAGE_KEYS.markers, local)
  _markersCache = null
  return item
}

function localUpdateMarker(id, data) {
  const local = readLocal(STORAGE_KEYS.markers) || []
  let found = local.find(m => m.id === id)
  if (found) {
    Object.assign(found, data)
  } else {
    found = { ...data, id }
    local.push(found)
  }
  writeLocal(STORAGE_KEYS.markers, local)
  _markersCache = null
  return found
}

function localDeleteMarker(id) {
  const local = readLocal(STORAGE_KEYS.markers) || []
  const cleaned = local.filter(m => m.id !== id)
  cleaned.push({ id, _deleted: true })
  writeLocal(STORAGE_KEYS.markers, cleaned)
  _markersCache = null
}

export {
  loadRegions,
  loadCategories,
  loadMarkers,
  loadMapsIndex,
  getChapterKey,
  getChapterName,
  getMapsForChapter,
  adminLogin,
  adminLogout,
  isAdminLoggedIn,
  getAdminUser,
  localAddRegion,
  localUpdateRegion,
  localDeleteRegion,
  localAddCategory,
  localUpdateCategory,
  localDeleteCategory,
  localAddMarker,
  localUpdateMarker,
  localDeleteMarker,
  STORAGE_KEYS,
}
