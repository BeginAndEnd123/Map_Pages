import { readAdminFlag, writeAdminFlag, readAdminUser, writeAdminUser, clearAdmin } from './storage'

const ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function login(password) {
  const hash = await sha256(password)
  if (hash === ADMIN_PASSWORD_HASH) {
    writeAdminFlag('true')
    writeAdminUser({ username: 'admin', is_admin: true })
    return true
  }
  return false
}

function logout() {
  clearAdmin()
}

function isLoggedIn() {
  return readAdminFlag() === 'true'
}

function getUser() {
  return readAdminUser() || null
}

export { login, logout, isLoggedIn, getUser }
