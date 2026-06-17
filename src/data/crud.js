import { readModifications, writeModifications, clearModifications } from './storage'

function _nextId(items) {
  if (items.length === 0) return 1
  return Math.max(...items.map(i => i.id)) + 1
}

function addItem(type, data, existingItems = []) {
  const mod = readModifications(type)
  const newId = _nextId([...existingItems, ...mod.additions])
  const item = { ...data, id: newId }
  mod.additions.push(item)
  writeModifications(type, mod)
  return item
}

function updateItem(type, id, data) {
  const mod = readModifications(type)
  mod.edits[id] = { ...(mod.edits[id] || {}), ...data }
  writeModifications(type, mod)
  return { ...data, id }
}

function deleteItem(type, id) {
  const mod = readModifications(type)
  mod.deletions.push(id)
  mod.additions = mod.additions.filter(item => item.id !== id)
  delete mod.edits[id]
  writeModifications(type, mod)
}

function getExportData() {
  const mod = readModifications('markers')
  const deleteSet = new Set(mod.deletions)
  return mod.additions
    .filter(m => !deleteSet.has(m.id))
    .map(m => {
      const { images, ...rest } = m
      return {
        ...rest,
        status: rest.status || 'approved',
        created_at: rest.created_at || new Date().toISOString(),
        submitted_by: rest.submitted_by ?? null,
      }
    })
}

function resetType(type) {
  clearModifications(type)
}

export { addItem, updateItem, deleteItem, getExportData, resetType }
