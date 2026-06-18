import { ref, reactive, onBeforeUnmount } from 'vue'

export function useDraggable() {
  const cardStyle = ref({})
  const dragging = ref(false)
  const offset = reactive({ x: 0, y: 0 })
  let startX = 0, startY = 0

  function _getPos(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    return { x: e.clientX, y: e.clientY }
  }

  function onDragStart(e) {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) return
    if (window.innerWidth <= 768) return
    e.preventDefault()
    dragging.value = true
    const pos = _getPos(e)
    startX = pos.x - offset.x
    startY = pos.y - offset.y
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
    document.addEventListener('touchmove', onDragMove, { passive: false })
    document.addEventListener('touchend', onDragEnd)
  }

  function onDragMove(e) {
    if (!dragging.value) return
    e.preventDefault()
    const pos = _getPos(e)
    offset.x = pos.x - startX
    offset.y = pos.y - startY
    cardStyle.value = { transform: `translate(${offset.x}px, ${offset.y}px)` }
  }

  function onDragEnd() {
    dragging.value = false
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('touchmove', onDragMove)
    document.removeEventListener('touchend', onDragEnd)
  }

  function cleanup() {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('touchmove', onDragMove)
    document.removeEventListener('touchend', onDragEnd)
  }

  onBeforeUnmount(cleanup)

  return { cardStyle, dragging, onDragStart, onDragEnd, cleanup }
}
