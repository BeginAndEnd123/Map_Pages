/**
 * 认证状态管理 — localStorage 管理员认证
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLogin as doLogin, adminLogout as doLogout, isAdminLoggedIn, getAdminUser } from '../data/loader'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(getAdminUser())
  const token = ref(isAdminLoggedIn() ? 'local-admin' : '')

  async function login(password) {
    const ok = await doLogin(password)
    if (ok) {
      token.value = 'local-admin'
      user.value = getAdminUser()
    } else {
      throw new Error('密码错误')
    }
  }

  function logout() {
    doLogout()
    user.value = null
    token.value = ''
  }

  function fetchUser() {
    if (isAdminLoggedIn()) {
      user.value = getAdminUser()
      token.value = 'local-admin'
    }
  }

  return { user, token, login, logout, fetchUser }
})
