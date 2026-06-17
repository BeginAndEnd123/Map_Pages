const STORAGE_KEYS = {
  regions: 'bg3_mod_regions',
  categories: 'bg3_mod_categories',
  markers: 'bg3_mod_markers',
  admin: 'bg3_admin_auth',
  adminUser: 'bg3_admin_user',
}

const EMPTY_MOD = Object.freeze({ additions: [], edits: {}, deletions: [] })

function _read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function _write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function _remove(key) {
  localStorage.removeItem(key)
}

function readModifications(type) {
  return _read(STORAGE_KEYS[type]) || { additions: [], edits: {}, deletions: [] }
}

function writeModifications(type, mod) {
  _write(STORAGE_KEYS[type], mod)
}

function readAdminFlag() {
  return _read(STORAGE_KEYS.admin)
}

function writeAdminFlag(value) {
  _write(STORAGE_KEYS.admin, value)
}

function readAdminUser() {
  return _read(STORAGE_KEYS.adminUser)
}

function writeAdminUser(user) {
  _write(STORAGE_KEYS.adminUser, user)
}

function clearAdmin() {
  _remove(STORAGE_KEYS.admin)
  _remove(STORAGE_KEYS.adminUser)
}

function clearModifications(type) {
  _remove(STORAGE_KEYS[type])
}

export {
  STORAGE_KEYS,
  EMPTY_MOD,
  readModifications,
  writeModifications,
  readAdminFlag,
  writeAdminFlag,
  readAdminUser,
  writeAdminUser,
  clearAdmin,
  clearModifications,
}
