<template>
  <div class="navbar">
    <div class="nav-left">
      <button class="menu-btn" @click="sidebar.toggleSidebar()" aria-label="菜单">
        <span class="menu-icon"></span>
      </button>
      <span class="brand">BG3 地图</span>
      <span class="visitor-stats">
        <span class="visitor-sep">&middot;</span>
        <span class="visitor-item">访问 <span id="busuanzi_value_site_pv" class="visitor-num">-</span></span>
        <span class="visitor-divider">|</span>
        <span class="visitor-item">访客 <span id="busuanzi_value_site_uv" class="visitor-num">-</span></span>
      </span>
    </div>
    <div class="nav-right">
      <template v-if="authStore.user">
        <span class="user-info">
          <span class="admin-badge" v-if="authStore.user.is_admin">管理员</span>
          <span class="user-name">{{ authStore.user.username }}</span>
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
import { useSidebar } from '../composables/useSidebar'

defineEmits(['toggle-sidebar'])

const authStore = useAuthStore()
const sidebar = useSidebar()
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
  height: 46px; padding: 0 12px;
  padding-top: env(safe-area-inset-top);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 12px rgba(0,0,0,0.3);
  flex-shrink: 0; z-index: 500;
}
.nav-left { display: flex; align-items: center; gap: 8px; }
.brand {
  font-family: var(--font-display);
  font-size: 15px; font-weight: 600; letter-spacing: 0.06em;
  color: var(--gold);
}
.menu-btn {
  display: none; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 0;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: transparent; cursor: pointer;
}
.menu-icon, .menu-icon::before, .menu-icon::after {
  display: block; width: 16px; height: 2px; background: var(--gold);
  border-radius: 1px; transition: all 0.2s;
}
.menu-icon { position: relative; }
.menu-icon::before, .menu-icon::after { content: ''; position: absolute; left: 0; }
.menu-icon::before { top: -5px; }
.menu-icon::after { top: 5px; }
.nav-right { display: flex; align-items: center; gap: 10px; }
.user-info { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.user-name { color: var(--text-primary); }
.admin-badge {
  font-size: 10px; font-weight: 600; letter-spacing: 0.05em;
  background: var(--gold); color: var(--bg-deep);
  padding: 1px 6px; border-radius: 2px;
}
.pw-input {
  padding: 4px 8px; font-size: 13px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  outline: none; font-family: var(--font-body);
  width: 120px;
}
.pw-input:focus { border-color: var(--gold-dim); }
.logout-btn {
  padding: 4px 12px; font-size: 13px;
  border: 1px solid rgba(200,164,78,0.25); border-radius: var(--radius-sm);
  background: transparent; color: var(--text-secondary); cursor: pointer;
  transition: all var(--transition); font-family: var(--font-body);
}
.logout-btn:hover { border-color: var(--gold); color: var(--gold); }
.login-btn {
  padding: 4px 12px; font-size: 13px;
  border: 1px solid var(--gold-dim); border-radius: var(--radius-sm);
  background: transparent; color: var(--gold); cursor: pointer;
  transition: all var(--transition); font-family: var(--font-body);
}
.login-btn:hover { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); }
.visitor-stats {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--font-display);
  font-size: 15px; font-weight: 600; letter-spacing: 0.06em;
  color: var(--gold);
  margin-left: 4px; user-select: none;
}
.visitor-sep { color: var(--gold); }
.visitor-divider { color: var(--gold-dim); }
.visitor-num { color: var(--gold-light); font-variant-numeric: tabular-nums; }

@media (max-width: 768px) {
  .navbar { height: 44px; padding: 0 10px; }
  .menu-btn { display: flex; }
  .brand { font-size: 13px; }
  .visitor-stats { display: none; }
  .pw-input { width: 90px; font-size: 12px; }
  .login-btn, .logout-btn { padding: 4px 10px; font-size: 12px; }
  .user-name { display: none; }
  .nav-right { gap: 6px; }
}
</style>
