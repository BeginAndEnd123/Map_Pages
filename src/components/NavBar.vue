<template>
  <div class="navbar">
    <span class="brand">BG3 交互式地图</span>
    <div class="nav-right">
      <template v-if="authStore.user">
        <span class="user-info">
          <span class="user-name">{{ authStore.user.username }}</span>
          <span v-if="authStore.user.is_admin" class="admin-badge">管理员</span>
        </span>
        <button class="logout-btn" @click="onLogout">登出</button>
      </template>
      <template v-else>
        <input v-model="password" type="password" placeholder="管理员密码" class="pw-input"
          @keyup.enter="onLogin" />
        <button class="login-btn" @click="onLogin">登录</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const password = ref('')

async function onLogin() {
  if (!password.value) return
  try {
    await authStore.login(password.value)
    password.value = ''
  } catch {
    alert('密码错误')
  }
}

function onLogout() {
  authStore.logout()
}
</script>

<style scoped>
.navbar {
  display: flex; align-items: center; justify-content: space-between;
  height: 46px; padding: 0 22px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 12px rgba(0,0,0,0.3);
}
.brand {
  font-family: var(--font-display);
  font-size: 15px; font-weight: 600; letter-spacing: 0.06em;
  color: var(--gold);
}
.nav-right { display: flex; align-items: center; gap: 16px; }
.user-info { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.user-name { color: var(--text-primary); }
.admin-badge {
  font-size: 10px; font-weight: 600; letter-spacing: 0.05em;
  background: var(--gold); color: var(--bg-deep);
  padding: 1px 7px; border-radius: 2px;
}
.pw-input {
  padding: 4px 10px; font-size: 13px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  outline: none; font-family: var(--font-body);
  width: 130px;
}
.pw-input:focus { border-color: var(--gold-dim); }
.logout-btn {
  padding: 4px 14px; font-size: 13px;
  border: 1px solid rgba(200,164,78,0.25); border-radius: var(--radius-sm);
  background: transparent; color: var(--text-secondary); cursor: pointer;
  transition: all var(--transition); font-family: var(--font-body);
}
.logout-btn:hover { border-color: var(--gold); color: var(--gold); }
.login-btn {
  padding: 4px 14px; font-size: 13px;
  border: 1px solid var(--gold-dim); border-radius: var(--radius-sm);
  background: transparent; color: var(--gold); cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font-body);
}
.login-btn:hover { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); }
</style>
