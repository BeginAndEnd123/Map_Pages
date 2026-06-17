<template>
  <div>
    <h2>博德之门3 地图</h2>

    <div class="region-select">
      <h3>选择区域</h3>
      <div class="select-row">
        <select :value="currentRegionId" @change="$emit('region-change', Number($event.target.value))">
          <option v-for="r in regions" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <button v-if="isAdmin" class="region-manage-btn" @click="$emit('region-manage')" title="区域管理">⚙</button>
      </div>
    </div>

    <div class="map-select" v-if="maps.length > 0">
      <h3>选择地图</h3>
        <select :value="selectedMapName" @change="$emit('map-change', $event.target.value)">
        <option v-for="m in maps" :key="m.name" :value="m.name">{{ m.name }}</option>
      </select>
    </div>

    <div class="category-filter">
      <h3>分类筛选</h3>
      <div class="category-grid">
        <label v-for="c in categories" :key="c.id" class="category-item">
          <input type="checkbox" :value="c.id" :checked="selectedCategoryIds.includes(c.id)"
            @change="$emit('category-filter-change', $event)" />
          <span>{{ c.name }}</span>
        </label>
      </div>
      <button v-if="isAdmin" class="category-manage-btn" @click="$emit('category-manage')">分类管理</button>
    </div>

    <div class="search-box">
      <h3>搜索标记</h3>
      <input type="text" :value="searchKeyword" placeholder="输入标记名称..."
        aria-label="搜索标记" @input="$emit('search-input', $event)"
        @focus="$emit('search-focus')" @blur="$emit('search-blur')" />
      <ul v-if="showSearchResults && searchResults.length" class="search-list" role="listbox">
        <li v-for="m in searchResults" :key="m.id" role="option" tabindex="0"
          @mousedown.prevent="$emit('search-select', m)" @keydown.enter.prevent="$emit('search-select', m)" @keydown.space.prevent="$emit('search-select', m)">
          <span class="sr-name">{{ m.name }}</span>
          <span class="sr-region">{{ m.region?.name || '' }}</span>
        </li>
      </ul>
    </div>

    <div class="stats">
      <h3>统计</h3>
      <p>标记总数：{{ recentTotal }}</p>
    </div>

    <div class="recent-markers">
      <h3>最新添加</h3>
      <ul v-if="recentMarkers.length > 0">
        <li v-for="m in recentMarkers" :key="m.id" role="button" tabindex="0"
          @click="$emit('recent-click', m)" @keydown.enter.prevent="$emit('recent-click', m)" @keydown.space.prevent="$emit('recent-click', m)"
          @mouseenter="$emit('recent-hover', m, $event)" @mouseleave="$emit('recent-leave')">
          <span class="recent-name">{{ m.name }}</span>
          <span class="recent-meta">{{ m.category?.name || '' }}{{ m.category?.name && m.region?.name ? ' · ' : '' }}{{ m.region?.name || '' }}</span>
        </li>
      </ul>
      <p v-else class="empty-text">暂无标记</p>
      <div v-if="recentTotal > 0" class="pagination">
        <div class="page-row">
          <button :disabled="recentPage <= 1" @click="$emit('recent-page', recentPage - 1)">‹</button>
          <template v-for="p in recentPages" :key="p">
            <button v-if="p !== '…'" :class="{ active: p === recentPage }" @click="$emit('recent-page', p)">{{ p }}</button>
            <span v-else class="page-dots">…</span>
          </template>
          <button :disabled="recentPage >= recentTotalPages" @click="$emit('recent-page', recentPage + 1)">›</button>
        </div>
        <div class="page-goto">
          <input type="number" :value="gotoPage" min="1" :max="recentTotalPages" aria-label="跳转到指定页码"
            @input="$emit('goto-page-input', Number($event.target.value))" @keyup.enter="$emit('goto-page-confirm')" />
          <button @click="$emit('goto-page-confirm')">跳转</button>
        </div>
      </div>
    </div>

    <button class="add-btn" @click="$emit('start-add')">
      {{ isAdmin ? '新增标记' : '管理员登录后可添加' }}
    </button>

    <button v-if="isAdmin" class="export-btn" @click="$emit('export-markers')">导出本地标记</button>
  </div>
</template>

<script setup>
defineProps({
  regions: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  maps: { type: Array, default: () => [] },
  currentRegionId: [Number, null],
  selectedMapName: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  searchKeyword: { type: String, default: '' },
  searchResults: { type: Array, default: () => [] },
  showSearchResults: { type: Boolean, default: false },
  selectedCategoryIds: { type: Array, default: () => [] },
  recentMarkers: { type: Array, default: () => [] },
  recentPage: { type: Number, default: 1 },
  recentTotal: { type: Number, default: 0 },
  recentTotalPages: { type: Number, default: 0 },
  recentPages: { type: Array, default: () => [] },
  gotoPage: { type: Number, default: 1 },
})

defineEmits([
  'region-change', 'map-change', 'category-filter-change',
  'search-input', 'search-focus', 'search-blur', 'search-select',
  'recent-click', 'recent-hover', 'recent-leave',
  'recent-page', 'goto-page-input', 'goto-page-confirm',
  'start-add', 'export-markers',
  'region-manage', 'category-manage',
])
</script>

<style scoped>
h2 {
  font-size: 18px; margin: 0 0 16px; color: var(--gold);
  text-align: center; letter-spacing: 0.1em;
  padding-bottom: 12px; border-bottom: 1px solid var(--border-gold);
  text-shadow: 0 0 20px rgba(200,164,78,0.15);
}
h3 {
  font-size: 11px; margin: 12px 0 5px; color: var(--text-secondary);
  font-family: var(--font-display); font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase;
}

.select-row { display: flex; gap: 4px; }
.select-row select { flex: 1; }

.region-select select, .map-select select {
  width: 100%; padding: 7px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 13px; font-family: var(--font-body);
  cursor: pointer; outline: none; transition: border var(--transition);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238a8578'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
}
.region-select select:focus, .map-select select:focus { border-color: var(--gold-dim); }

.region-manage-btn {
  padding: 7px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-secondary);
  cursor: pointer; font-size: 14px; transition: all var(--transition);
  line-height: 1;
}
.region-manage-btn:hover { border-color: var(--gold-dim); color: var(--gold); }

.category-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px;
}
.category-item {
  display: flex; align-items: center; gap: 5px;
  margin: 2px 0; cursor: pointer; font-size: 13px;
  padding: 2px 6px; border-radius: var(--radius-sm);
  transition: background var(--transition);
}
.category-item:hover { background: rgba(200,164,78,0.06); }
.category-item input[type="checkbox"] { accent-color: var(--gold); }
.category-manage-btn {
  width: 100%; margin-top: 8px; padding: 7px 12px;
  border: 1px solid var(--gold-dim); border-radius: var(--radius-sm);
  background: linear-gradient(180deg, rgba(200,164,78,0.06) 0%, transparent 100%);
  color: var(--gold-light);
  font-family: var(--font-body); font-size: 12px;
  cursor: pointer; transition: all var(--transition);
}
.category-manage-btn:hover { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); }

.search-box { position: relative; }
.search-box input {
  width: 100%; padding: 7px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 13px; font-family: var(--font-body);
  outline: none; transition: border var(--transition);
}
.search-box input:focus { border-color: var(--gold-dim); }
.search-list {
  position: absolute; top: 100%; left: 0; right: 0;
  background: var(--bg-card); border: 1px solid var(--border-gold);
  border-top: none; border-radius: 0 0 var(--radius-md) var(--radius-md);
  list-style: none; max-height: 160px; overflow-y: auto; z-index: 100;
}
.search-list li {
  padding: 6px 10px; cursor: pointer; font-size: 13px;
  display: flex; justify-content: space-between; align-items: center;
  transition: background var(--transition);
}
.search-list li:hover { background: rgba(200,164,78,0.08); }
.sr-name { color: var(--text-primary); }
.sr-region { color: var(--text-muted); font-size: 11px; }

.stats {
  margin-top: 14px; padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 13px; color: var(--text-secondary);
}
.stats p { margin: 4px 0; }

.recent-markers { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); }
.recent-markers ul { list-style: none; margin-top: 2px; height: 110px; }
.recent-markers li {
  display: flex; justify-content: space-between; align-items: center;
  padding: 2px 4px; font-size: 12px;
  border-radius: var(--radius-sm); cursor: pointer;
  transition: background var(--transition);
}
.recent-markers li:hover { background: rgba(200,164,78,0.06); }
.recent-markers li + li { border-top: 1px solid rgba(42,40,64,0.5); }
.recent-name { color: var(--text-primary); }
.recent-meta { color: var(--text-muted); font-size: 11px; }
.empty-text { font-size: 13px; color: var(--text-muted); margin-top: 2px; height: 110px; }

.pagination { margin-top: 4px; }
.page-row { display: flex; align-items: center; justify-content: center; gap: 3px; }
.page-row button {
  background: var(--bg-input); color: var(--text-secondary);
  border: 1px solid var(--border); min-width: 24px; height: 24px;
  border-radius: var(--radius-sm); cursor: pointer; font-size: 12px;
  font-family: var(--font-body); transition: all var(--transition);
}
.page-row button:hover:not(:disabled):not(.active) { border-color: var(--gold-dim); color: var(--gold); }
.page-row button:disabled { opacity: 0.25; cursor: default; }
.page-row button.active { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); font-weight: 600; }
.page-dots { color: var(--text-muted); font-size: 12px; min-width: 16px; text-align: center; }
.page-goto { display: flex; align-items: center; justify-content: flex-end; gap: 3px; margin-top: 3px; }
.page-goto input {
  width: 48px; height: 22px; padding: 0 3px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 11px; font-family: var(--font-body); text-align: center; outline: none;
}
.page-goto input:focus { border-color: var(--gold-dim); }
.page-goto input::-webkit-outer-spin-button,
.page-goto input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.page-goto input[type="number"] { -moz-appearance: textfield; }
.page-goto button {
  min-width: 28px; height: 22px; font-size: 11px;
  background: var(--gold); color: var(--bg-deep);
  border: none; border-radius: var(--radius-sm); cursor: pointer;
  font-weight: 600; font-family: var(--font-body);
  transition: background var(--transition);
}
.page-goto button:hover { background: var(--gold-light); }

.add-btn {
  width: 100%; margin-top: 12px; padding: 7px 12px;
  border: 1px solid var(--gold-dim); border-radius: var(--radius-sm);
  background: linear-gradient(180deg, rgba(200,164,78,0.06) 0%, transparent 100%);
  color: var(--gold-light);
  font-family: var(--font-body); font-size: 12px;
  cursor: pointer; transition: all var(--transition);
}
.add-btn:hover { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); }

.export-btn {
  width: 100%; margin-top: 8px; padding: 7px 12px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: transparent; color: var(--text-secondary);
  font-family: var(--font-body); font-size: 12px;
  cursor: pointer; transition: all var(--transition);
}
.export-btn:hover { border-color: var(--gold); color: var(--gold); }
</style>
