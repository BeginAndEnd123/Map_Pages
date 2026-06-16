<template>
  <div class="map-page">
    <SidePanel :model-value="sidebarOpen">
      <h2>博德之门3 地图</h2>

      <div class="region-select">
        <h3>选择区域</h3>
        <div class="select-row">
          <select v-model="nav.currentRegionId.value" @change="onRegionChange">
            <option v-for="r in mapStore.regions" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <button v-if="isAdmin" class="region-manage-btn" @click="showRegionManager = true" title="区域管理">⚙</button>
        </div>
      </div>

      <div class="map-select" v-if="mapStore.maps.length > 0">
        <h3>选择地图</h3>
        <select v-model="nav.selectedMapName.value" @change="onMapChange">
          <option v-for="m in mapStore.maps" :key="m.name" :value="m.name">{{ m.name }}</option>
        </select>
      </div>

      <div class="category-filter">
        <h3>分类筛选</h3>
        <div class="category-grid">
          <label v-for="c in mapStore.categories" :key="c.id" class="category-item">
            <input type="checkbox" :value="c.id" v-model="selectedCategoryIds" @change="reloadMarkers" />
            <span>{{ c.name }}</span>
          </label>
        </div>
        <button v-if="isAdmin" class="category-manage-btn" @click="showCategoryManager = true">分类管理</button>
      </div>

      <div class="search-box">
        <h3>搜索标记</h3>
        <input type="text" v-model="search.keyword.value" placeholder="输入标记名称..."
          aria-label="搜索标记" @input="search.onSearchInput()"
          @focus="search.showSearchResults.value = true" @blur="search.onSearchBlur()" />
        <ul v-if="search.showSearchResults.value && search.searchResults.value.length" class="search-list" role="listbox">
          <li v-for="m in search.searchResults.value" :key="m.id" role="option" tabindex="0"
            @mousedown.prevent="onSearchClick(m)" @keydown.enter.prevent="onSearchClick(m)" @keydown.space.prevent="onSearchClick(m)">
            <span class="sr-name">{{ m.name }}</span>
            <span class="sr-region">{{ m.region?.name || '' }}</span>
          </li>
        </ul>
      </div>

      <div class="stats">
        <h3>统计</h3>
        <p>标记总数：{{ recent.recentTotal.value }}</p>
      </div>

      <div class="recent-markers">
        <h3>最新添加</h3>
        <ul v-if="recent.recentMarkers.value.length > 0">
          <li v-for="m in recent.recentMarkers.value" :key="m.id" role="button" tabindex="0"
            @click="onRecentClick(m)" @keydown.enter.prevent="onRecentClick(m)" @keydown.space.prevent="onRecentClick(m)"
            @mouseenter="onRecentHover(m, $event)" @mouseleave="onRecentLeave">
            <span class="recent-name">{{ m.name }}</span>
            <span class="recent-meta">{{ m.category?.name || '' }}{{ m.category?.name && m.region?.name ? ' · ' : '' }}{{ m.region?.name || '' }}</span>
          </li>
        </ul>
        <p v-else class="empty-text">暂无标记</p>
        <div v-if="recent.recentTotal.value > 0" class="pagination">
          <div class="page-row">
            <button :disabled="recent.recentPage.value <= 1" @click="recent.onRecentPage(recent.recentPage.value - 1)">‹</button>
            <template v-for="p in recent.recentPages.value" :key="p">
              <button v-if="p !== '…'" :class="{ active: p === recent.recentPage.value }" @click="recent.onRecentPage(p)">{{ p }}</button>
              <span v-else class="page-dots">…</span>
            </template>
            <button :disabled="recent.recentPage.value >= recent.recentTotalPages.value" @click="recent.onRecentPage(recent.recentPage.value + 1)">›</button>
          </div>
          <div class="page-goto">
            <input type="number" v-model.number="recent.gotoPage.value" min="1" :max="recent.recentTotalPages.value" aria-label="跳转到指定页码" @keyup.enter="recent.onGotoPage()" />
            <button @click="recent.onGotoPage()">跳转</button>
          </div>
        </div>
      </div>

      <button class="add-btn" @click="onStartAdd">
        {{ isAdmin ? '新增标记' : '管理员登录后可添加' }}
      </button>
    </SidePanel>

    <CategoryManager
      :visible="showCategoryManager"
      :categories="mapStore.categories"
      @close="showCategoryManager = false"
      @refresh="refreshCategories"
    />

    <RegionManager
      :visible="showRegionManager"
      :regions="mapStore.regions"
      @close="showRegionManager = false"
      @refresh="refreshRegions"
    />

    <div class="map-wrapper">
      <MapContainer ref="mapRef" :tile-url="tileUrl" :max-zoom="mapMaxZoom"
        :markers="mapStore.markers" :categories="mapStore.categories"
        :pick-mode="pick.pickMode.value" :temp-marker="pick.tempMarker.value"
        :is-admin="isAdmin"
        @marker-click="onMarkerClick"
        @marker-teleport="onMarkerTeleport"
        @map-pick="pick.onMapPick($event)" />

      <div class="loading-mask" v-if="nav.loading.value">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div class="pick-overlay" v-if="pick.pickMode.value">
        <div class="pick-hint">点击地图放置标记，拖动微调位置</div>
        <button class="confirm-btn" @click="onConfirmPick">确认位置</button>
      </div>
    </div>

    <div class="sidebar-backdrop" v-if="sidebarOpen" @click="uiStore.closeSidebar()"></div>

    <MarkerPopup v-if="selectedMarker" :marker="selectedMarker"
      :category-name="selectedCategoryName"
      :transparent="!!hoverPreviewMarker"
      :position="hoverPosition"
      @close="onPopupClose">
      <template #actions v-if="isAdmin">
        <button v-if="selectedCategoryName === '传送点' && selectedMarker?.target_region_id"
          class="action-btn teleport" @click="onTeleportFromPopup(selectedMarker)">传送</button>
        <button class="action-btn edit" @click="onEdit(selectedMarker)">编辑</button>
        <button class="action-btn delete" @click="onDelete(selectedMarker.id)">删除</button>
      </template>
    </MarkerPopup>

    <MarkerForm v-if="form.showAddForm.value || form.editingMarker.value"
      :marker="form.editingMarker.value" :categories="mapStore.categories"
      :regions="mapStore.regions" :region-id="nav.currentRegionId.value"
      :initial-coords="pick.pickerCoords.value" :submitting="form.formSubmitting.value"
      @close="onFormClose" @submit="onFormSubmit" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useMapStore } from '../stores/map'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import SidePanel from '../components/SidePanel.vue'
import MapContainer from '../components/MapContainer.vue'
import MarkerPopup from '../components/MarkerPopup.vue'
import MarkerForm from '../components/MarkerForm.vue'
import CategoryManager from '../components/CategoryManager.vue'
import RegionManager from '../components/RegionManager.vue'
import { useMapNavigation } from '../composables/useMapNavigation'
import { useMarkerSearch } from '../composables/useMarkerSearch'
import { useRecentMarkers } from '../composables/useRecentMarkers'
import { usePickMode } from '../composables/usePickMode'
import { useMarkerForm } from '../composables/useMarkerForm'

const mapStore = useMapStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const mapRef = ref(null)
const selectedMarker = ref(null)
const selectedCategoryIds = ref([])
const sidebarOpen = computed(() => uiStore.sidebarOpen)

watch(() => mapStore.categories, (cats) => {
  if (cats.length > 0 && selectedCategoryIds.value.length === 0) {
    selectedCategoryIds.value = cats.map(c => c.id)
  }
})

const nav = useMapNavigation()
const search = useMarkerSearch()
const recent = useRecentMarkers(5)
const pick = usePickMode()
const form = useMarkerForm()

const isAdmin = computed(() => !!authStore.user?.is_admin)
const tileUrl = computed(() => mapStore.currentMap?.tile_url || '')
const mapMaxZoom = computed(() => mapStore.currentMap?.max_zoom || 6)
const selectedCategoryName = computed(() => {
  if (!selectedMarker.value) return ''
  const cat = mapStore.categories.find(c => c.id === selectedMarker.value.category_id)
  return cat?.name || ''
})

const showCategoryManager = ref(false)
const showRegionManager = ref(false)

async function refreshCategories() {
  await mapStore.fetchCategories()
  showCategoryManager.value = false
}

async function refreshRegions() {
  await mapStore.fetchRegions()
  showRegionManager.value = false
}

function reloadMarkers() {
  nav.loadMarkers({ category_id: selectedCategoryIds.value.join(',') })
}

function onSearchClick(marker) {
  selectedMarker.value = search.onSearchSelect(marker,
    (rid, mn, x, y) => nav.switchToRegion(rid, mn, x, y, mapRef)
  )
}

function onRecentClick(marker) {
  if (hoverLeaveTimer) clearTimeout(hoverLeaveTimer)
  isClicked = true
  hoverPreviewMarker = marker
  onSearchClick(marker)
}

let hoverPreviewMarker = null
let hoverLeaveTimer = null
let isClicked = false
const hoverPosition = ref({ left: '0px', top: '0px' })

async function onRecentHover(marker, event) {
  if (hoverLeaveTimer) { clearTimeout(hoverLeaveTimer); hoverLeaveTimer = null }
  isClicked = false
  hoverPreviewMarker = marker
  selectedMarker.value = marker
  const rect = event.currentTarget.getBoundingClientRect()
  const cardW = 380
  let left = rect.right + 12
  let top = rect.top - 8
  if (left + cardW > window.innerWidth - 16) {
    left = rect.left - cardW - 12
  }
  if (left < 8) left = 8
  if (top < 8) top = 8
  hoverPosition.value = { left: left + 'px', top: top + 'px' }
  await nextTick()
  const card = document.querySelector('.marker-card.floating')
  if (card) {
    const cr = card.getBoundingClientRect()
    if (cr.bottom > window.innerHeight - 8) {
      const adjust = cr.bottom - window.innerHeight + 8
      hoverPosition.value = { left: left + 'px', top: (top - adjust) + 'px' }
    }
  }
}

function onRecentLeave() {
  hoverLeaveTimer = setTimeout(() => {
    if (!hoverPreviewMarker || isClicked) return
    hoverPreviewMarker = null
    selectedMarker.value = null
    if (mapRef.value?.clearHighlight) mapRef.value.clearHighlight()
  }, 150)
}

function onPopupClose() {
  hoverPreviewMarker = null
  isClicked = false
  selectedMarker.value = null
}

function onMarkerClick(marker) {
  selectedMarker.value = marker
}

async function onTeleportFromPopup(marker) {
  onPopupClose()
  await onMarkerTeleport(marker)
}

async function onMarkerTeleport(marker) {
  if (!marker.target_region_id) return
  await nav.switchToRegion(marker.target_region_id, marker.target_map_name,
    marker.target_x, marker.target_y, mapRef)
}

function onStartAdd() {
  if (!isAdmin.value) {
    alert('请先在顶部导航栏以管理员身份登录')
    return
  }
  pick.onStartAdd()
  form.showAddForm.value = false
}

function onConfirmPick() {
  if (pick.onConfirmPosition()) form.showAddForm.value = true
}

async function onFormSubmit(data) {
  const ok = await form.onFormSubmit(data, nav.selectedMapName.value)
  if (ok) {
    pick.reset()
    await recent.fetchRecentMarkers()
  }
}

function onFormClose() {
  form.closeForm()
  pick.reset()
}

function onEdit(marker) {
  form.onEditMarker(marker)
  selectedMarker.value = null
}

async function onDelete(id) {
  const ok = await form.onDeleteMarker(id)
  if (ok) {
    selectedMarker.value = null
    await recent.fetchRecentMarkers()
  }
}

async function onRegionChange() {
  search.keyword.value = ''
  await nav.onRegionChange(() => mapRef.value?.resetView())
}

async function onMapChange() {
  search.keyword.value = ''
  mapRef.value?.resetView()
  await nav.onMapChange()
}

onMounted(async () => {
  try {
    await Promise.all([
      mapStore.fetchRegions(),
      mapStore.fetchCategories(),
      authStore.fetchUser(),
    ])
  } catch {
    console.error('初始化加载失败')
  }
  if (mapStore.regions.length > 0) {
    nav.currentRegionId.value = mapStore.regions[0].id
    mapStore.setRegion(mapStore.regions[0])
    await nav.fetchMaps()
  }
  await nav.loadMarkers()
  recent.fetchRecentMarkers()
})

onBeforeUnmount(() => {
  search.cleanup()
  if (hoverLeaveTimer) clearTimeout(hoverLeaveTimer)
})
</script>

<style scoped>
.map-page { display: flex; flex: 1; overflow: hidden; }

:deep(h2) {
  font-size: 18px; margin: 0 0 16px; color: var(--gold);
  text-align: center; letter-spacing: 0.1em;
  padding-bottom: 12px; border-bottom: 1px solid var(--border-gold);
  text-shadow: 0 0 20px rgba(200,164,78,0.15);
}
:deep(h3) {
  font-size: 11px; margin: 12px 0 5px; color: var(--text-secondary);
  font-family: var(--font-display); font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase;
}

.select-row { display: flex; gap: 4px; }
.select-row select { flex: 1; }

.region-select select, .map-select select {
  width: 100%; padding: 7px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 13px; font-family: var(--font-body);
  cursor: pointer; outline: none; transition: border var(--transition);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238a8578'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
}
.region-select select:focus, .map-select select:focus { border-color: var(--gold-dim); }

.region-manage-btn {
  padding: 7px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-secondary);
  cursor: pointer; font-size: 14px; transition: all var(--transition);
  line-height: 1;
}
.region-manage-btn:hover { border-color: var(--gold-dim); color: var(--gold); }

.category-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px;
}
.category-item {
  display: flex; align-items: center; gap: 5px;
  margin: 2px 0; cursor: pointer; font-size: 13px;
  padding: 2px 6px; border-radius: var(--radius-sm);
  transition: background var(--transition);
}
.category-item:hover { background: rgba(200,164,78,0.06); }
.category-item input[type="checkbox"] { accent-color: var(--gold); }
.category-manage-btn {
  width: 100%; margin-top: 8px; padding: 7px 12px;
  border: 1px solid var(--gold-dim); border-radius: var(--radius-sm);
  background: linear-gradient(180deg, rgba(200,164,78,0.06) 0%, transparent 100%);
  color: var(--gold-light);
  font-family: var(--font-body); font-size: 12px;
  cursor: pointer; transition: all var(--transition);
}
.category-manage-btn:hover { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); }

.search-box { position: relative; }
.search-box input {
  width: 100%; padding: 7px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 13px; font-family: var(--font-body);
  outline: none; transition: border var(--transition);
}
.search-box input:focus { border-color: var(--gold-dim); }
.search-list {
  position: absolute; top: 100%; left: 0; right: 0;
  background: var(--bg-card); border: 1px solid var(--border-gold);
  border-top: none; border-radius: 0 0 var(--radius-md) var(--radius-md);
  list-style: none; max-height: 160px; overflow-y: auto; z-index: 100;
}
.search-list li {
  padding: 6px 10px; cursor: pointer; font-size: 13px;
  display: flex; justify-content: space-between; align-items: center;
  transition: background var(--transition);
}
.search-list li:hover { background: rgba(200,164,78,0.08); }
.sr-name { color: var(--text-primary); }
.sr-region { color: var(--text-muted); font-size: 11px; }

.stats {
  margin-top: 14px; padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 13px; color: var(--text-secondary);
}
.stats p { margin: 4px 0; }

.recent-markers { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); }
.recent-markers ul { list-style: none; margin-top: 2px; height: 110px; }
.recent-markers li {
  display: flex; justify-content: space-between; align-items: center;
  padding: 2px 4px; font-size: 12px;
  border-radius: var(--radius-sm); cursor: pointer;
  transition: background var(--transition);
}
.recent-markers li:hover { background: rgba(200,164,78,0.06); }
.recent-markers li + li { border-top: 1px solid rgba(42,40,64,0.5); }
.recent-name { color: var(--text-primary); }
.recent-meta { color: var(--text-muted); font-size: 11px; }
.empty-text { font-size: 13px; color: var(--text-muted); margin-top: 2px; height: 110px; }

.pagination { margin-top: 4px; }
.page-row { display: flex; align-items: center; justify-content: center; gap: 3px; }
.page-row button {
  background: var(--bg-input); color: var(--text-secondary);
  border: 1px solid var(--border); min-width: 24px; height: 24px;
  border-radius: var(--radius-sm); cursor: pointer; font-size: 12px;
  font-family: var(--font-body); transition: all var(--transition);
}
.page-row button:hover:not(:disabled):not(.active) { border-color: var(--gold-dim); color: var(--gold); }
.page-row button:disabled { opacity: 0.25; cursor: default; }
.page-row button.active { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); font-weight: 600; }
.page-dots { color: var(--text-muted); font-size: 12px; min-width: 16px; text-align: center; }
.page-goto { display: flex; align-items: center; justify-content: flex-end; gap: 3px; margin-top: 3px; }
.page-goto input {
  width: 48px; height: 22px; padding: 0 3px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 11px; font-family: var(--font-body); text-align: center; outline: none;
}
.page-goto input:focus { border-color: var(--gold-dim); }
.page-goto input::-webkit-outer-spin-button,
.page-goto input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.page-goto input[type="number"] { -moz-appearance: textfield; }
.page-goto button {
  min-width: 28px; height: 22px; font-size: 11px;
  background: var(--gold); color: var(--bg-deep);
  border: none; border-radius: var(--radius-sm); cursor: pointer;
  font-weight: 600; font-family: var(--font-body);
  transition: background var(--transition);
}
.page-goto button:hover { background: var(--gold-light); }

.add-btn {
  width: 100%; margin-top: 12px; padding: 7px 12px;
  border: 1px solid var(--gold-dim); border-radius: var(--radius-sm);
  background: linear-gradient(180deg, rgba(200,164,78,0.06) 0%, transparent 100%);
  color: var(--gold-light);
  font-family: var(--font-body); font-size: 12px;
  cursor: pointer; transition: all var(--transition);
}
.add-btn:hover { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); }

.map-wrapper { flex: 1; position: relative; background: #000; }

.loading-mask {
  position: absolute; inset: 0;
  background: rgba(8,8,18,0.5); display: flex;
  flex-direction: column; align-items: center; justify-content: center;
  z-index: 999; color: var(--text-secondary); font-size: 14px; gap: 12px;
}
.spinner {
  width: 28px; height: 28px;
  border: 2px solid rgba(200,164,78,0.2);
  border-top-color: var(--gold); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.pick-overlay {
  position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1000;
}
.pick-hint {
  background: rgba(8,8,18,0.85); color: var(--gold);
  padding: 8px 24px; border-radius: var(--radius-sm); font-size: 13px;
  border: 1px solid var(--border-gold); white-space: nowrap;
}
.confirm-btn {
  padding: 10px 32px; border: none; border-radius: var(--radius-sm);
  background: var(--gold); color: var(--bg-deep);
  font-family: var(--font-display); font-size: 14px;
  font-weight: 600; letter-spacing: 0.06em;
  cursor: pointer; box-shadow: var(--shadow-gold);
  transition: background var(--transition);
}
.confirm-btn:hover { background: var(--gold-light); }

.sidebar-backdrop {
  display: none;
}
@media (max-width: 768px) {
  .sidebar-backdrop {
    display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 350;
  }
  .pick-hint { font-size: 12px; padding: 6px 16px; }
  .confirm-btn { font-size: 13px; padding: 8px 24px; }
}
</style>
