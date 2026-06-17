<template>
  <div class="overlay" v-if="visible" @click.self="onOverlayClose" @keydown.escape="onOverlayClose">
    <div class="card" ref="card" :style="cardStyle" role="dialog" aria-modal="true" aria-label="区域管理">
      <div class="card-header" @mousedown="onDragStart">
        <h3>区域管理</h3>
        <button class="close-btn" @click="$emit('close')" aria-label="关闭">&times;</button>
      </div>

      <form @submit.prevent="onAdd" class="add-form">
        <div class="form-row">
          <input v-model="form.name" placeholder="名称，如：第4章" required class="name-input" />
        </div>
        <div class="form-row">
          <input v-model="form.description" placeholder="描述（可选）" class="name-input" />
        </div>
        <div class="form-row">
          <button type="submit" class="btn-add" :disabled="submitting">
            {{ submitting ? '提交中...' : (editingId ? '保存修改' : '添加区域') }}
          </button>
          <button v-if="editingId" type="button" class="btn-cancel-edit" @click="cancelEdit">取消</button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <ul class="region-list">
        <li v-for="r in regions" :key="r.id" class="region-item">
          <span class="region-name">{{ r.name }}</span>
          <span class="region-desc">{{ r.description || '' }}</span>
          <button class="btn-edit" @click="startEdit(r)">编辑</button>
          <button class="btn-del" @click="onDelete(r)" :disabled="deleting === r.id">
            {{ deleting === r.id ? '...' : '删除' }}
          </button>
        </li>
      </ul>
      <p v-if="regions.length === 0" class="empty">暂无区域</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { addItem, updateItem, deleteItem } from '../data/index'
import { useMapStore } from '../stores/map'

const props = defineProps({
  visible: { type: Boolean, default: false },
  regions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'refresh'])

const mapStore = useMapStore()
const form = reactive({ name: '', description: '' })
const error = ref('')
const submitting = ref(false)
const deleting = ref(null)
const editingId = ref(null)

async function onAdd() {
  if (submitting.value) return
  error.value = ''
  if (!form.name.trim()) return
  submitting.value = true
  try {
    if (editingId.value) {
      updateItem('regions', editingId.value, { name: form.name.trim(), description: form.description.trim() })
    } else {
      addItem('regions', { name: form.name.trim(), description: form.description.trim() }, props.regions)
    }
    cancelEdit()
    mapStore.fetchRegions()
    emit('refresh')
  } catch {
    error.value = '操作失败'
  } finally {
    submitting.value = false
  }
}

function startEdit(r) {
  editingId.value = r.id
  form.name = r.name
  form.description = r.description || ''
}

function cancelEdit() {
  editingId.value = null
  form.name = ''
  form.description = ''
}

function onOverlayClose() {
  if (dragging.value) onDragEnd()
  emit('close')
}

async function onDelete(r) {
  if (!confirm(`确认删除区域「${r.name}」？`)) return
  deleting.value = r.id
  try {
    deleteItem('regions', r.id)
    mapStore.fetchRegions()
    emit('refresh')
  } catch {
    alert('删除失败')
  } finally {
    deleting.value = null
  }
}

const card = ref(null)
const cardStyle = ref({})
const dragging = ref(false)
const offset = reactive({ x: 0, y: 0 })
let startX = 0, startY = 0

function onDragStart(e) {
  if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return
  e.preventDefault()
  dragging.value = true
  startX = e.clientX - offset.x
  startY = e.clientY - offset.y
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e) {
  if (!dragging.value) return
  offset.x = e.clientX - startX
  offset.y = e.clientY - startY
  cardStyle.value = { transform: `translate(${offset.x}px, ${offset.y}px)` }
}

function onDragEnd() {
  dragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
})
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(8,8,18,0.5);
  z-index: 1100; display: flex; align-items: center; justify-content: center;
}
.card {
  background: var(--bg-surface); color: var(--text-primary);
  border: 1px solid var(--border-gold); border-radius: var(--radius-sm);
  width: 380px; max-width: 90%; max-height: 80vh;
  overflow-y: auto; box-shadow: var(--shadow-gold); position: relative;
}
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 0 20px; cursor: grab; user-select: none;
}
.card-header:active { cursor: grabbing; }
.card-header h3 {
  font-family: var(--font-display); font-size: 16px;
  color: var(--gold); letter-spacing: 0.06em; margin: 0;
}
.close-btn {
  background: none; border: none; color: var(--text-muted);
  font-size: 20px; cursor: pointer; padding: 0;
}
.close-btn:hover { color: var(--gold); }

.add-form { padding: 12px 20px; border-bottom: 1px solid var(--border); }
.form-row { display: flex; gap: 8px; margin-bottom: 8px; }
.name-input {
  width: 100%; padding: 5px 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 13px; font-family: var(--font-body); outline: none;
}
.name-input:focus { border-color: var(--gold-dim); }
.btn-add {
  padding: 5px 16px; border: none; border-radius: var(--radius-sm);
  background: var(--gold); color: var(--bg-deep);
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font-body);
}
.btn-add:hover { background: var(--gold-light); }
.btn-add:disabled { opacity: 0.4; cursor: not-allowed; }
.error { color: var(--danger); font-size: 12px; margin: 4px 0 0 0; }

.region-list { list-style: none; padding: 8px 20px 16px 20px; }
.region-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; border-top: 1px solid var(--border);
}
.region-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.region-desc { font-size: 11px; color: var(--text-muted); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-del {
  padding: 2px 8px; border: none; border-radius: var(--radius-sm);
  background: transparent; color: var(--danger);
  font-size: 11px; cursor: pointer; font-family: var(--font-body);
}
.btn-del:hover { background: var(--danger); color: #fff; }
.btn-del:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-edit {
  padding: 2px 8px; border: none; border-radius: var(--radius-sm);
  background: transparent; color: var(--gold-dim);
  font-size: 11px; cursor: pointer; font-family: var(--font-body);
}
.btn-edit:hover { color: var(--gold); }
.btn-cancel-edit {
  padding: 5px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: transparent; color: var(--text-secondary);
  font-size: 12px; cursor: pointer; font-family: var(--font-body);
}
.btn-cancel-edit:hover { border-color: var(--text-secondary); color: var(--text-primary); }
.empty { font-size: 13px; color: var(--text-muted); text-align: center; padding: 16px 0; }

@media (max-width: 768px) {
  .card { width: 100%; max-width: 100%; max-height: 100vh; border-radius: 0; }
  .add-form { padding: 10px 16px; }
  .region-list { padding: 8px 16px 16px 16px; }
}
</style>
