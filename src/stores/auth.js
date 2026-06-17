import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as doLogin, logout as doLogout, isLoggedIn, getUser } from '../data/index'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(getUser())
  const token = ref(isLoggedIn() ? 'local-admin' : '')

  async function login(password) {
    const ok = await doLogin(password)
    if (ok) {
      token.value = 'local-admin'
      user.value = getUser()
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
    if (isLoggedIn()) {
      user.value = getUser()
      token.value = 'local-admin'
    }
  }

  return { user, token, login, logout, fetchUser }
})
