/**
 * useMarkerForm — 标记表单管理（localStorage 版）
 */
import { ref } from 'vue'
import { useMapStore } from '../stores/map'

export function useMarkerForm() {
  const mapStore = useMapStore()
  const showAddForm = ref(false)
  const editingMarker = ref(null)
  const formSubmitting = ref(false)

  function onEditMarker(marker) {
    editingMarker.value = { ...marker }
  }

  function closeForm() {
    showAddForm.value = false
    editingMarker.value = null
    formSubmitting.value = false
  }

  async function onFormSubmit(data, selectedMapName) {
    formSubmitting.value = true
    try {
      const payload = { ...data, map_name: selectedMapName }
      if (editingMarker.value) {
        await mapStore.editMarker(editingMarker.value.id, payload)
      } else {
        await mapStore.addMarker(payload)
      }
      closeForm()
      return true
    } catch (e) {
      alert('操作失败，请稍后重试')
      return false
    } finally {
      formSubmitting.value = false
    }
  }

  async function onDeleteMarker(id) {
    if (!confirm('确认删除该标记？')) return false
    try {
      await mapStore.removeMarker(id)
      return true
    } catch (e) {
      alert('删除失败，请稍后重试')
      return false
    }
  }

  return {
    showAddForm, editingMarker, formSubmitting,
    onEditMarker, closeForm, onFormSubmit, onDeleteMarker,
  }
}
