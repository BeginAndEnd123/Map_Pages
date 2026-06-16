<template>
  <div class="form-overlay">
    <div class="form-card" role="dialog" aria-modal="true" :aria-label="isEdit ? '编辑标记' : '新增标记'">
      <h3>{{ isEdit ? '编辑标记' : '新增标记' }}</h3>
      <form @submit.prevent="onSubmit">
        <label>
          名称
          <input v-model="form.name" required placeholder="标记名称" />
        </label>
        <label>
          分类
          <select v-model="form.category_id" required>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>
        <label>
          描述
          <textarea v-model="form.description" placeholder="可选描述" rows="3"></textarea>
        </label>
        <label>
          截图路径
          <input v-model="screenshotPath" placeholder="如 /screenshots/xxx.png（可选）" />
        </label>

        <p v-if="error" class="form-error">{{ error }}</p>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">取消</button>
          <button type="submit" class="btn-submit" :disabled="props.submitting">
            {{ props.submitting ? '提交中...' : (isEdit ? '保存' : '创建') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { loadMarkers } from '../data/loader'
import { useMapStore } from '../stores/map'

const props = defineProps({
  marker: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  regions: { type: Array, default: () => [] },
  regionId: { type: Number, default: null },
  initialCoords: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

const mapStore = useMapStore()
const isEdit = computed(() => !!props.marker)
const isWaypoint = computed(() => {
  const cat = props.categories.find(c => c.id === form.category_id)
  return cat?.name === '传送点'
})
const error = ref('')
const screenshotPath = ref('')
const hasTarget = ref(false)
const selectedWaypointId = ref(null)
const allWaypoints = ref([])

const form = reactive({
  name: '',
  category_id: props.categories[0]?.id || null,
  description: '',
  x_coord: 0,
  y_coord: 0,
  images: [],
  screenshot: [],
  target_region_id: null,
  target_map_name: '',
  target_x: null,
  target_y: null,
})

async function fetchAllWaypoints() {
  try {
    const wpCat = props.categories.find(c => c.name === '传送点')
    if (!wpCat) return
    const all = await loadMarkers()
    allWaypoints.value = all.filter(m => m.category_id === wpCat.id)
  } catch {
    allWaypoints.value = []
  }
}

onMounted(async () => {
  if (props.marker) {
    form.name = props.marker.name
    form.category_id = props.marker.category_id
    form.description = props.marker.description || ''
    form.x_coord = Number(props.marker.x_coord)
    form.y_coord = Number(props.marker.y_coord)
    const imgs = props.marker.screenshot
    form.screenshot = Array.isArray(imgs) ? [...imgs] : []
    screenshotPath.value = form.screenshot.length > 0 ? form.screenshot[0] : ''
    form.target_region_id = props.marker.target_region_id
    form.target_map_name = props.marker.target_map_name || ''
    form.target_x = props.marker.target_x
    form.target_y = props.marker.target_y
    hasTarget.value = !!props.marker.target_region_id
  } else if (props.initialCoords) {
    form.x_coord = props.initialCoords.x
    form.y_coord = props.initialCoords.y
    if (!form.category_id && props.categories.length > 0) {
      form.category_id = props.categories[0].id
    }
  }
  if (isWaypoint.value) await fetchAllWaypoints()
})

watch(() => props.initialCoords, (coords) => {
  if (coords && !props.marker) {
    form.x_coord = coords.x
    form.y_coord = coords.y
  }
})

watch(isWaypoint, (val) => {
  if (val && allWaypoints.value.length === 0) fetchAllWaypoints()
})

onBeforeUnmount(() => {})

async function onSubmit() {
  error.value = ''
  const imgs = screenshotPath.value.trim() ? [screenshotPath.value.trim()] : []
  form.screenshot = imgs
  const payload = { ...form, region_id: props.regionId, screenshot: imgs }
  emit('submit', payload)
}
</script>

<style scoped>
.form-overlay {
  position: fixed; inset: 0; background: rgba(8,8,18,0.5);
  z-index: 1100; display: flex; align-items: center; justify-content: center;
}
.form-card {
  background: var(--bg-surface); color: var(--text-primary);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  padding: 28px; width: 420px; max-width: 90%; max-height: 90vh;
  overflow-y: auto; box-shadow: var(--shadow-gold);
}
.form-card h3 {
  font-family: var(--font-display); font-size: 17px;
  margin-bottom: 20px; color: var(--gold); letter-spacing: 0.06em;
}
label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 14px; }
label input, label select, label textarea {
  width: 100%; margin-top: 4px; padding: 8px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 14px; font-family: var(--font-body);
  outline: none; transition: border var(--transition);
}
label input:focus, label select:focus, label textarea:focus { border-color: var(--gold-dim); }
label textarea { resize: vertical; }
.upload-status { color: var(--text-muted); font-size: 12px; margin-top: 4px; }
.image-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.image-item { position: relative; width: 80px; height: 80px; }
.upload-preview { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm); }
.img-remove {
  position: absolute; top: -6px; right: -6px;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--danger); color: #fff; border: none;
  font-size: 14px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.form-error { color: var(--danger); font-size: 13px; margin: 8px 0; }
.form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel, .btn-submit {
  padding: 8px 20px; border: none; border-radius: var(--radius-sm);
  font-size: 14px; cursor: pointer; font-family: var(--font-body);
  transition: all var(--transition);
}
.btn-cancel { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
.btn-cancel:hover { border-color: var(--text-secondary); color: var(--text-primary); }
.btn-submit { background: var(--gold); color: var(--bg-deep); font-weight: 600; }
.btn-submit:hover { background: var(--gold-light); }
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 768px) {
  .form-card { width: 100%; max-width: 100%; max-height: 100vh; border-radius: 0; padding: 20px; }
  .form-actions { flex-direction: column; }
  .btn-cancel, .btn-submit { width: 100%; text-align: center; }
}
</style>
