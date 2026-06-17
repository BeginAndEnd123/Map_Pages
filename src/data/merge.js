function mergeData(jsonArr, modifications, idKey = 'id') {
  const { additions = [], edits = {}, deletions = [] } = modifications || {}
  const deleteSet = new Set(deletions)

  const merged = {}

  jsonArr.forEach(item => {
    const id = item[idKey]
    merged[id] = { ...item, ...(edits[id] || {}) }
  })

  additions.forEach(item => {
    merged[item[idKey]] = item
  })

  return Object.values(merged).filter(item => !deleteSet.has(item[idKey]))
}

export { mergeData }
