<template>
  <div class="map-page">
    <SidePanel :model-value="sidebarOpen">
      <MapSidebar
        :regions="mapStore.regions"
        :categories="mapStore.categories"
        :maps="mapStore.maps"
        :current-region-id="nav.currentRegionId.value"
        :selected-map-name="nav.selectedMapName.value"
        :is-admin="isAdmin"
        :search-keyword="search.keyword.value"
        :search-results="search.searchResults.value"
        :show-search-results="search.showSearchResults.value"
        :selected-category-ids="selectedCategoryIds"
        :recent-markers="recent.recentMarkers.value"
        :recent-page="recent.recentPage.value"
        :recent-total="recent.recentTotal.value"
        :recent-total-pages="recent.recentTotalPages.value"
        :recent-pages="recent.recentPages.value"
        :goto-page="recent.gotoPage.value"
        @region-change="onRegionChange"
        @map-change="onMapChange"
        @category-filter-change="onCategoryFilterChange"
        @search-input="search.onSearchInput"
        @search-focus="search.showSearchResults.value = true"
        @search-blur="search.onSearchBlur"
        @search-select="onSearchClick"
        @recent-click="onRecentClick"
        @recent-hover="onRecentHover"
        @recent-leave="onRecentLeave"
        @recent-page="recent.onRecentPage"
        @goto-page-input="(v) => recent.gotoPage.value = v"
        @goto-page-confirm="recent.onGotoPage"
        @start-add="onStartAdd"
        @export-markers="onExportMarkers"
        @clear-data="onClearData"
        @region-manage="showRegionManager = true"
        @category-manage="showCategoryManager = true"
      />
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
        <div class="pick-hint">{{ isMobile() ? '轻触地图放置标记，按住拖动微调' : '点击地图放置标记，拖动微调位置' }}</div>
        <button class="confirm-btn" @click="onConfirmPick">确认位置</button>
      </div>
    </div>

    <div class="sidebar-backdrop" v-if="sidebarOpen" @click="sidebar.closeSidebar()"></div>

    <MarkerPopup v-if="selectedMarker" :marker="selectedMarker"
      :category-name="selectedCategoryName"
      :transparent="!!hoverPreviewMarker"
      :position="hoverPosition"
      :category-color="'#3388ff'"
      @close="onPopupClose">
      <template #actions v-if="isAdmin">
        <button v-if="selectedCategoryName === '传送点' && selectedMarker?.target_region_id"
          class="action-btn teleport" @click="onTeleportFromPopup(selectedMarker)">传送</button>
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
import { useSidebar } from '../composables/useSidebar'
import { getExportData, clearAll, clearCaches, clearModifications } from '../data/index'
import SidePanel from '../components/SidePanel.vue'
import MapContainer from '../components/MapContainer.vue'
import MarkerPopup from '../components/MarkerPopup.vue'
import MarkerForm from '../components/MarkerForm.vue'
import CategoryManager from '../components/CategoryManager.vue'
import RegionManager from '../components/RegionManager.vue'
import MapSidebar from '../components/MapSidebar.vue'
import { useMapNavigation } from '../composables/useMapNavigation'
import { useMarkerSearch } from '../composables/useMarkerSearch'
import { useRecentMarkers } from '../composables/useRecentMarkers'
import { usePickMode } from '../composables/usePickMode'
import { useMarkerForm } from '../composables/useMarkerForm'

const mapStore = useMapStore()
const authStore = useAuthStore()
const sidebar = useSidebar()
const mapRef = ref(null)
const selectedMarker = ref(null)
const selectedCategoryIds = ref([])
const sidebarOpen = computed(() => sidebar.sidebarOpen.value)

function isMobile() { return window.innerWidth <= 768 }

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

function onCategoryFilterChange(e) {
  const val = Number(e.target.value)
  const checked = e.target.checked
  if (checked) {
    if (!selectedCategoryIds.value.includes(val)) selectedCategoryIds.value.push(val)
  } else {
    selectedCategoryIds.value = selectedCategoryIds.value.filter(id => id !== val)
  }
  nav.loadMarkers({ category_id: selectedCategoryIds.value.join(',') })
}

function onSearchClick(marker) {
  selectedMarker.value = search.onSearchSelect(marker,
    (rid, mn, x, y) => nav.switchToRegion(rid, mn, x, y, mapRef)
  )
  if (isMobile()) sidebar.closeSidebar()
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
  if (isMobile()) return
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

async function onExportMarkers() {
  const markers = getExportData()
  if (markers.length === 0) {
    alert('没有可导出的本地标记')
    return
  }
  const json = JSON.stringify(markers, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bg3_local_markers_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  clearModifications('markers')
  clearCaches()
  await nav.loadMarkers()
  recent.fetchRecentMarkers()
}

async function onClearData() {
  if (!confirm('确定要清除所有本地数据吗？\n\n这将删除所有本地新增/修改的标记、分类和区域，并清除管理员登录状态。')) return
  clearAll()
  clearCaches()
  authStore.fetchUser()
  await mapStore.fetchRegions()
  await mapStore.fetchCategories()
  if (mapStore.regions.length > 0) {
    nav.currentRegionId.value = mapStore.regions[0].id
    mapStore.setRegion(mapStore.regions[0])
    await nav.fetchMaps()
  }
  await nav.loadMarkers()
  recent.fetchRecentMarkers()
}

async function onRegionChange(regionId) {
  nav.currentRegionId.value = regionId
  search.keyword.value = ''
  if (isMobile()) sidebar.closeSidebar()
  await nav.onRegionChange(() => mapRef.value?.resetView())
}

async function onMapChange(mapName) {
  nav.selectedMapName.value = mapName
  search.keyword.value = ''
  if (isMobile()) sidebar.closeSidebar()
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

.map-wrapper { flex: 1; position: relative; z-index: 0; background: #000; }

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

.sidebar-backdrop { display: none; }

@media (max-width: 768px) {
  .sidebar-backdrop {
    display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 350;
  }
  .pick-hint { font-size: 12px; padding: 6px 16px; }
  .confirm-btn { font-size: 15px; padding: 12px 40px; }
}
</style>
