<template>
  <div class="admin-container">
    <h2>后台管理</h2>
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <button
          class="sidebar-btn"
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          数据概览
        </button>
        <button
          class="sidebar-btn"
          :class="{ active: activeTab === 'pending' }"
          @click="activeTab = 'pending'"
        >
          待审核商品
        </button>
        <button
          class="sidebar-btn"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          全部商品
        </button>
      </aside>
      <section class="admin-content">
        <div v-if="activeTab === 'overview'" class="overview">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">用户总数</div>
              <div class="stat-value">{{ statistics.totalUsers }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">在售商品</div>
              <div class="stat-value">{{ statistics.availableItems }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">完成交易</div>
              <div class="stat-value">{{ statistics.completedTransactions }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">待审核商品</div>
              <div class="stat-value">{{ pendingCount }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">已拒绝商品</div>
              <div class="stat-value">{{ rejectedCount }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">商品总数</div>
              <div class="stat-value">{{ totalItemCount }}</div>
            </div>
          </div>
          <div class="charts-row">
            <div class="chart-section">
              <h3 class="chart-title">平台概览图</h3>
              <div class="chart-container">
                <div
                  v-for="item in chartSeries"
                  :key="item.key"
                  class="chart-bar-wrapper"
                >
                  <div class="chart-bar-label">{{ item.label }}</div>
                  <div class="chart-bar-track">
                    <div
                      class="chart-bar-fill"
                      :style="{ width: item.percentage + '%' }"
                    ></div>
                  </div>
                  <div class="chart-bar-value">{{ item.value }}</div>
                </div>
              </div>
            </div>
            <div class="chart-section">
              <h3 class="chart-title">商品状态分布</h3>
              <div class="pie-chart-wrapper">
                <svg
                  class="pie-chart"
                  viewBox="0 0 36 36"
                >
                  <circle
                    class="pie-ring"
                    cx="18"
                    cy="18"
                    r="15.9155"
                  />
                  <circle
                    v-for="slice in statusPieSlices"
                    :key="slice.key"
                    class="pie-slice"
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    :stroke="slice.color"
                    stroke-width="3"
                    :stroke-dasharray="slice.dashArray"
                    :stroke-dashoffset="slice.dashOffset"
                  />
                </svg>
                <div class="pie-legend-wrapper">
                  <div v-if="statusPieSlices.length === 0" class="empty-text">
                    暂无数据
                  </div>
                  <ul v-else class="pie-legend">
                    <li
                      v-for="slice in statusPieSlices"
                      :key="slice.key"
                      class="pie-legend-item"
                    >
                      <span
                        class="pie-legend-color"
                        :style="{ backgroundColor: slice.color }"
                      ></span>
                      <span class="pie-legend-label">{{ slice.label }}</span>
                      <span class="pie-legend-value">{{ slice.value }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-section">
            <h3 class="chart-title">各分类商品数量（前 8 名）</h3>
            <div class="pie-chart-wrapper">
              <svg
                class="pie-chart"
                viewBox="0 0 36 36"
              >
                <circle
                  class="pie-ring"
                  cx="18"
                  cy="18"
                  r="15.9155"
                />
                <circle
                  v-for="slice in categoryPieSlices"
                  :key="slice.key"
                  class="pie-slice"
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  :stroke="slice.color"
                  stroke-width="3"
                  :stroke-dasharray="slice.dashArray"
                  :stroke-dashoffset="slice.dashOffset"
                />
              </svg>
              <div class="pie-legend-wrapper">
                <div v-if="categoryPieSlices.length === 0" class="empty-text">
                  暂无数据
                </div>
                <ul v-else class="pie-legend">
                  <li
                    v-for="slice in categoryPieSlices"
                    :key="slice.key"
                    class="pie-legend-item"
                  >
                    <span
                      class="pie-legend-color"
                      :style="{ backgroundColor: slice.color }"
                    ></span>
                    <span class="pie-legend-label">{{ slice.label }}</span>
                    <span class="pie-legend-value">{{ slice.value }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="activeTab === 'pending'" class="pending-items">
          <h3>待审核商品</h3>
          <div class="table-actions">
            <input
              v-model="pendingSearch"
              type="text"
              class="table-search-input"
              placeholder="按标题搜索待审核商品"
            />
          </div>
          <div v-if="filteredPendingItems.length === 0" class="empty-text">
            当前没有待审核的商品
          </div>
          <div v-else class="items-table-wrapper">
            <table class="items-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>价格</th>
                  <th>卖家</th>
                  <th>分类</th>
                  <th>地点</th>
                  <th>发布时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredPendingItems" :key="item.id">
                  <td>{{ item.id }}</td>
                  <td>
                    <button class="link-btn" @click="openDetail(item)">
                      {{ item.title }}
                    </button>
                  </td>
                  <td>¥{{ formatPrice(item.price) }}</td>
                  <td>{{ item.user && (item.user.realName || item.user.username) }}</td>
                  <td>{{ item.category && (item.category.name || item.category) }}</td>
                  <td>{{ item.location }}</td>
                  <td>{{ formatDate(item.createdAt) }}</td>
                  <td>
                    <button class="btn btn-detail" @click="openDetail(item)" :disabled="loadingIds[item.id]">
                      详情
                    </button>
                    <button class="btn btn-edit" @click="openEdit(item)" :disabled="loadingIds[item.id]">
                      编辑
                    </button>
                    <button class="btn btn-approve" @click="approveItem(item.id)" :disabled="loadingIds[item.id]">
                      通过
                    </button>
                    <button class="btn btn-reject" @click="rejectItem(item.id)" :disabled="loadingIds[item.id]">
                      拒绝
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else-if="activeTab === 'all'" class="all-items">
          <h3>全部商品</h3>
          <div class="table-actions">
            <input
              v-model="allSearch"
              type="text"
              class="table-search-input"
              placeholder="按标题搜索商品"
            />
            <select v-model="allStatusFilter" class="table-select">
              <option value="">全部状态</option>
              <option value="AVAILABLE">在售</option>
              <option value="PENDING">待审核</option>
              <option value="REJECTED">已拒绝</option>
            </select>
          </div>
          <div class="items-table-wrapper">
            <table class="items-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>价格</th>
                  <th>状态</th>
                  <th>卖家</th>
                  <th>分类</th>
                  <th>地点</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredAllItems" :key="item.id">
                  <td>{{ item.id }}</td>
                  <td>
                    <button class="link-btn" @click="openDetail(item)">
                      {{ item.title }}
                    </button>
                  </td>
                  <td>¥{{ formatPrice(item.price) }}</td>
                  <td>
                    <span class="status-badge" :class="item.status">{{ item.status }}</span>
                  </td>
                  <td>{{ item.user && (item.user.realName || item.user.username) }}</td>
                  <td>{{ item.category && (item.category.name || item.category) }}</td>
                  <td>{{ item.location }}</td>
                  <td>
                    <button class="btn btn-detail" @click="openDetail(item)" :disabled="loadingIds[item.id]">
                      详情
                    </button>
                    <button class="btn btn-edit" @click="openEdit(item)" :disabled="loadingIds[item.id]">
                      编辑
                    </button>
                    <button class="btn btn-delete" @click="deleteItem(item.id)" :disabled="loadingIds[item.id]">
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
    <div v-if="showDetailModal && selectedItem" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">商品详情</h3>
          <button class="modal-close" @click="closeDetail">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-main">
            <div class="modal-image" v-if="selectedItem.images && selectedItem.images.length > 0">
              <img :src="selectedItem.images[0].imageUrl" alt="商品图片" />
            </div>
            <div class="modal-info">
              <div class="modal-field">
                <span class="field-label">标题</span>
                <span class="field-value">{{ selectedItem.title }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">价格</span>
                <span class="field-value">¥{{ formatPrice(selectedItem.price) }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">状态</span>
                <span class="field-value">{{ mapStatusLabel(selectedItem.status) }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">分类</span>
                <span class="field-value">{{ selectedItem.category && (selectedItem.category.name || selectedItem.category) }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">地点</span>
                <span class="field-value">{{ selectedItem.location }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">卖家</span>
                <span class="field-value">{{ selectedItem.user && (selectedItem.user.realName || selectedItem.user.username) }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">发布时间</span>
                <span class="field-value">{{ formatDate(selectedItem.createdAt) }}</span>
              </div>
            </div>
          </div>
          <div class="modal-description" v-if="selectedItem.description">
            <div class="field-label">描述</div>
            <p class="field-value">{{ selectedItem.description }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-close" @click="closeDetail">关闭</button>
        </div>
      </div>
    </div>
    <div v-if="showEditModal && editItem" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">编辑商品</h3>
          <button class="modal-close" @click="closeEdit">×</button>
        </div>
        <div class="modal-body">
          <form class="edit-form" @submit.prevent="submitEdit">
            <div class="edit-grid">
              <div class="edit-main">
                <div class="form-group">
                  <label>标题</label>
                  <input
                    type="text"
                    v-model="editForm.title"
                    class="edit-input"
                  />
                  <div v-if="editErrors.title" class="error-text">{{ editErrors.title }}</div>
                </div>
                <div class="form-group">
                  <label>价格</label>
                  <div class="price-input-wrapper">
                    <span class="price-symbol">¥</span>
                    <input
                      type="number"
                      v-model.number="editForm.price"
                      class="edit-input"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div v-if="editErrors.price" class="error-text">{{ editErrors.price }}</div>
                </div>
                <div class="form-group">
                  <label>分类</label>
                  <select v-model="editForm.categoryId" class="edit-input">
                    <option value="">选择分类</option>
                    <option
                      v-for="category in categories"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                  <div v-if="editErrors.categoryId" class="error-text">{{ editErrors.categoryId }}</div>
                </div>
                <div class="form-group">
                  <label>新旧程度</label>
                  <select v-model="editForm.condition" class="edit-input">
                    <option value="new">全新</option>
                    <option value="like_new">九成新</option>
                    <option value="good">八成新</option>
                    <option value="Acceptable">七成新</option>
                    <option value="poor">六成新以下</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>状态</label>
                  <select v-model="editForm.status" class="edit-input">
                    <option value="AVAILABLE">在售</option>
                    <option value="PENDING">待审核</option>
                    <option value="REJECTED">已拒绝</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>交易地点</label>
                  <input
                    type="text"
                    v-model="editForm.location"
                    class="edit-input"
                  />
                  <div v-if="editErrors.location" class="error-text">{{ editErrors.location }}</div>
                </div>
                <div class="form-group">
                  <label>描述</label>
                  <textarea
                    rows="4"
                    v-model="editForm.description"
                    class="edit-textarea"
                  ></textarea>
                  <div v-if="editErrors.description" class="error-text">{{ editErrors.description }}</div>
                </div>
              </div>
              <div class="edit-images">
                <label>商品图片</label>
                <div class="image-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    @change="handleEditImageUpload"
                  />
                  <div class="upload-button">
                    <p>点击或拖拽图片到此处上传</p>
                    <p class="help-text">支持JPG、PNG，最多 5 张</p>
                  </div>
                </div>
                <div v-if="editErrors.images" class="error-text">{{ editErrors.images }}</div>
                <div v-if="editForm.images.length > 0" class="image-preview-container">
                  <div
                    class="image-preview"
                    v-for="(image, index) in editForm.images"
                    :key="index"
                  >
                    <img :src="image.url" :alt="`图片 ${index + 1}`" />
                    <button
                      type="button"
                      class="remove-image"
                      @click="removeEditImage(index)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="editErrors.general" class="error-text general-error">
              {{ editErrors.general }}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-close" @click="closeEdit" :disabled="editSubmitting">
                取消
              </button>
              <button type="submit" class="btn btn-approve" :disabled="editSubmitting">
                {{ editSubmitting ? '保存中...' : '保存修改' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api/index.js';

export default {
  name: 'AdminView',
  data() {
    return {
      activeTab: 'overview',
      statistics: {
        totalUsers: 0,
        availableItems: 0,
        completedTransactions: 0
      },
      pendingItems: [],
      allItems: [],
      loadingIds: {},
      itemStatusStats: {
        AVAILABLE: 0,
        PENDING: 0,
        REJECTED: 0
      },
      itemCategoryStats: [],
      showDetailModal: false,
      selectedItem: null,
      pendingSearch: '',
      allSearch: '',
      allStatusFilter: '',
      showEditModal: false,
      editItem: null,
      editForm: {
        id: null,
        title: '',
        description: '',
        price: '',
        categoryId: '',
        condition: 'new',
        status: 'PENDING',
        location: '',
        images: []
      },
      editErrors: {},
      editSubmitting: false,
      categories: []
    }
  },
  computed: {
    totalItemCount() {
      const stats = this.itemStatusStats || {};
      return Object.values(stats).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
    },
    pendingCount() {
      const stats = this.itemStatusStats || {};
      if (typeof stats.PENDING === 'number') {
        return stats.PENDING;
      }
      return this.pendingItems.length;
    },
    rejectedCount() {
      const stats = this.itemStatusStats || {};
      if (typeof stats.REJECTED === 'number') {
        return stats.REJECTED;
      }
      return 0;
    },
    chartSeries() {
      const data = [
        {
          key: 'users',
          label: '用户总数',
          value: this.statistics.totalUsers || 0
        },
        {
          key: 'available',
          label: '在售商品',
          value: this.statistics.availableItems || 0
        },
        {
          key: 'completed',
          label: '完成交易',
          value: this.statistics.completedTransactions || 0
        },
        {
          key: 'pending',
          label: '待审核商品',
          value: this.pendingCount || 0
        }
      ];
      const max = data.reduce((m, d) => (d.value > m ? d.value : m), 0) || 1;
      return data.map(d => ({
        key: d.key,
        label: d.label,
        value: d.value,
        percentage: Math.max(5, (d.value / max) * 100)
      }));
    },
    statusChartSeries() {
      const entries = Object.entries(this.itemStatusStats || {});
      if (entries.length === 0) return [];
      const max = entries.reduce((m, [_, v]) => (v > m ? v : m), 0) || 1;
      return entries.map(([status, count]) => ({
        key: status,
        label: this.mapStatusLabel(status),
        value: count,
        percentage: Math.max(5, (count / max) * 100)
      }));
    },
    categoryChartSeries() {
      const items = Array.isArray(this.itemCategoryStats) ? this.itemCategoryStats : [];
      if (items.length === 0) return [];
      const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 8);
      const max = sorted.reduce((m, d) => (d.count > m ? d.count : m), 0) || 1;
      return sorted.map(d => ({
        key: d.category || '未分类',
        label: d.category || '未分类',
        value: d.count,
        percentage: Math.max(5, (d.count / max) * 100)
      }));
    },
    statusPieSlices() {
      return this.getPieSlices(this.statusChartSeries, 'status');
    },
    categoryPieSlices() {
      return this.getPieSlices(this.categoryChartSeries, 'category');
    },
    filteredPendingItems() {
      const search = (this.pendingSearch || '').toLowerCase();
      if (!search) {
        return this.pendingItems;
      }
      return this.pendingItems.filter(item => {
        const title = (item.title || '').toLowerCase();
        return title.includes(search);
      });
    },
    filteredAllItems() {
      const search = (this.allSearch || '').toLowerCase();
      const statusFilter = this.allStatusFilter || '';
      return this.allItems.filter(item => {
        const title = (item.title || '').toLowerCase();
        const status = item.status || '';
        const titleMatch = search ? title.includes(search) : true;
        const statusMatch = statusFilter ? status === statusFilter : true;
        return titleMatch && statusMatch;
      });
    }
  },
  async mounted() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo.role || userInfo.role !== 'ADMIN') {
      alert('只有管理员可以访问后台管理页面');
      this.$router.push('/');
      return;
    }
    await this.fetchCategories();
    await this.fetchStatistics();
    await this.fetchItemStatusStats();
    await this.fetchItemCategoryStats();
    await this.fetchPendingItems();
    await this.fetchAllItems();
  },
  methods: {
    mapStatusLabel(status) {
      const key = (status || '').toUpperCase();
      const map = {
        AVAILABLE: '在售',
        PENDING: '待审核',
        REJECTED: '已拒绝'
      };
      return map[key] || status || '';
    },
    getPieSlices(series, type) {
      const items = Array.isArray(series) ? series.filter(d => d && typeof d.value === 'number' && d.value > 0) : [];
      if (items.length === 0) {
        return [];
      }
      const total = items.reduce((sum, d) => sum + d.value, 0);
      if (!total) {
        return [];
      }
      const radius = 15.9155;
      const circumference = 2 * Math.PI * radius;
      let cumulative = 0;
      return items.map((d, index) => {
        const portion = d.value / total;
        const sliceLength = portion * circumference;
        const slice = {
          key: d.key,
          label: d.label,
          value: d.value,
          color: this.getPieColor(type, index),
          dashArray: sliceLength + ' ' + (circumference - sliceLength),
          dashOffset: -cumulative * circumference
        };
        cumulative += portion;
        return slice;
      });
    },
    getPieColor(type, index) {
      const statusColors = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6'];
      const categoryColors = ['#60a5fa', '#f97316', '#22c55e', '#a855f7', '#facc15', '#14b8a6', '#f43f5e', '#6366f1'];
      const colors = type === 'status' ? statusColors : categoryColors;
      const idx = index % colors.length;
      return colors[idx];
    },
    async fetchCategories() {
      try {
        const response = await api.category.getAll();
        this.categories = response.data || [];
      } catch (error) {
        console.error('获取分类列表失败:', error);
        this.categories = [];
      }
    },
    async fetchStatistics() {
      try {
        const response = await api.statistics.getStatistics();
        const data = response.data || {};
        this.statistics.totalUsers = data.totalUsers || data.total_users || 0;
        this.statistics.availableItems = data.availableItems || data.available_items || 0;
        this.statistics.completedTransactions = data.completedTransactions || data.completed_transactions || 0;
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    },
    async fetchItemStatusStats() {
      try {
        const response = await api.statistics.getItemStatus();
        this.itemStatusStats = response.data || {};
      } catch (error) {
        console.error('获取商品状态统计失败:', error);
        this.itemStatusStats = {};
      }
    },
    async fetchItemCategoryStats() {
      try {
        const response = await api.statistics.getItemCategory();
        const data = response.data || [];
        this.itemCategoryStats = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('获取商品分类统计失败:', error);
        this.itemCategoryStats = [];
      }
    },
    async fetchPendingItems() {
      try {
        const response = await api.item.getPending(0, 50);
        const page = response.data;
        this.pendingItems = page.content || page || [];
      } catch (error) {
        console.error('获取待审核商品失败:', error);
        this.pendingItems = [];
      }
    },
    async fetchAllItems() {
      try {
        const response = await api.item.getAll(0, 50);
        const page = response.data;
        this.allItems = page.content || page || [];
      } catch (error) {
        console.error('获取全部商品失败:', error);
        this.allItems = [];
      }
    },
    formatPrice(price) {
      if (!price && price !== 0) {
        return '0.00';
      }
      const num = typeof price === 'number' ? price : Number(price);
      if (isNaN(num)) {
        return '0.00';
      }
      return num.toFixed(2);
    },
    formatDate(dateString) {
      if (!dateString) {
        return '';
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleString('zh-CN');
    },
    openDetail(item) {
      this.selectedItem = item;
      this.showDetailModal = true;
    },
    closeDetail() {
      this.showDetailModal = false;
      this.selectedItem = null;
    },
    openEdit(item) {
      this.editItem = item;
      this.editErrors = {};
      this.editForm.id = item.id;
      this.editForm.title = item.title || '';
      this.editForm.description = item.description || '';
      this.editForm.price = item.price || '';
      this.editForm.categoryId = item.category && item.category.id ? item.category.id : item.category || '';
      this.editForm.condition = item.itemCondition || item.condition || 'new';
      this.editForm.status = item.status || 'PENDING';
      this.editForm.location = item.location || '';
      this.editForm.images = Array.isArray(item.images)
        ? item.images.map(image => ({
            file: null,
            url: image.imageUrl
          }))
        : [];
      this.showEditModal = true;
    },
    closeEdit() {
      if (this.editSubmitting) {
        return;
      }
      this.showEditModal = false;
      this.editItem = null;
      this.editForm = {
        id: null,
        title: '',
        description: '',
        price: '',
        categoryId: '',
        condition: 'new',
        status: 'PENDING',
        location: '',
        images: []
      };
      this.editErrors = {};
    },
    handleEditImageUpload(event) {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      if (this.editForm.images.length + files.length > 5) {
        this.editErrors.images = '最多只能上传5张图片';
        return;
      }

      const validFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
          this.editErrors.images = '只支持JPG和PNG格式的图片';
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.editErrors.images = '每张图片大小不能超过5MB';
          return;
        }
        validFiles.push(file);
      }

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const reader = new FileReader();
        reader.onload = e => {
          this.editForm.images.push({
            file,
            url: e.target.result
          });
        };
        reader.readAsDataURL(file);
      }

      event.target.value = '';
      if (this.editErrors.images) {
        delete this.editErrors.images;
      }
    },
    removeEditImage(index) {
      this.editForm.images.splice(index, 1);
      if (this.editErrors.images) {
        delete this.editErrors.images;
      }
    },
    validateEditForm() {
      this.editErrors = {};
      let isValid = true;
      const title = (this.editForm.title || '').trim();
      if (!title) {
        this.editErrors.title = '请输入标题';
        isValid = false;
      }
      if (this.editForm.price === '' || isNaN(this.editForm.price)) {
        this.editErrors.price = '请输入有效的价格';
        isValid = false;
      } else if (this.editForm.price <= 0) {
        this.editErrors.price = '价格必须大于0';
        isValid = false;
      }
      if (!this.editForm.categoryId) {
        this.editErrors.categoryId = '请选择分类';
        isValid = false;
      }
      const location = (this.editForm.location || '').trim();
      if (!location) {
        this.editErrors.location = '请输入交易地点';
        isValid = false;
      }
      if (!this.editForm.description || this.editForm.description.trim().length < 10) {
        this.editErrors.description = '描述至少需要10个字符';
        isValid = false;
      }
      if (!this.editForm.images || this.editForm.images.length === 0) {
        this.editErrors.images = '请至少上传一张图片';
        isValid = false;
      }
      return isValid;
    },
    async submitEdit() {
      if (!this.editForm.id) {
        return;
      }
      if (!this.validateEditForm()) {
        return;
      }
      this.editSubmitting = true;
      this.loadingIds[this.editForm.id] = true;
      const payload = {
        title: this.editForm.title,
        description: this.editForm.description,
        price: this.editForm.price,
        category: {
          id: this.editForm.categoryId
        },
        itemCondition: this.editForm.condition,
        status: this.editForm.status,
        location: this.editForm.location,
        images: this.editForm.images.map((image, index) => ({
          imageUrl: image.url,
          isMain: index === 0
        }))
      };
      try {
        await api.item.update(this.editForm.id, payload);
        await this.fetchPendingItems();
        await this.fetchAllItems();
        if (this.selectedItem && this.selectedItem.id === this.editForm.id) {
          const updated = this.allItems.find(i => i.id === this.editForm.id) || this.pendingItems.find(i => i.id === this.editForm.id);
          if (updated) {
            this.selectedItem = updated;
          }
        }
        this.closeEdit();
      } catch (error) {
        console.error('更新商品失败:', error);
        this.editErrors.general = error.response?.data?.message || '更新失败，请稍后重试';
      } finally {
        this.editSubmitting = false;
        delete this.loadingIds[this.editForm.id];
      }
    },
    async approveItem(id) {
      this.loadingIds[id] = true;
      try {
        await api.item.approve(id);
        await this.fetchPendingItems();
        await this.fetchAllItems();
      } catch (error) {
        console.error('审核通过失败:', error);
        alert('审核通过失败，请稍后重试');
      } finally {
        delete this.loadingIds[id];
      }
    },
    async rejectItem(id) {
      this.loadingIds[id] = true;
      try {
        await api.item.reject(id);
        await this.fetchPendingItems();
        await this.fetchAllItems();
      } catch (error) {
        console.error('拒绝商品失败:', error);
        alert('拒绝商品失败，请稍后重试');
      } finally {
        delete this.loadingIds[id];
      }
    },
    async deleteItem(id) {
      if (!confirm('确定要删除该商品吗？此操作不可恢复。')) {
        return;
      }
      this.loadingIds[id] = true;
      try {
        await api.item.delete(id);
        await this.fetchPendingItems();
        await this.fetchAllItems();
      } catch (error) {
        console.error('删除商品失败:', error);
        alert('删除商品失败，请稍后重试');
      } finally {
        delete this.loadingIds[id];
      }
    }
  }
}
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.admin-container h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  text-align: center;
}

.admin-layout {
  display: flex;
  gap: 1.5rem;
}

.admin-sidebar {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-btn {
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #f4f4f4;
  color: #333;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.sidebar-btn.active {
  background-color: #4a6fa5;
  color: #fff;
}

.admin-content {
  flex: 1;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 1.2rem 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: bold;
  color: #4a6fa5;
}

.chart-section {
  margin-top: 2rem;
}

.chart-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.chart-bar-wrapper {
  display: grid;
  grid-template-columns: 100px 1fr 60px;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.chart-bar-label {
  color: #555;
}

.chart-bar-track {
  height: 10px;
  border-radius: 999px;
  background-color: #f1f5f9;
  overflow: hidden;
}

.chart-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4a6fa5, #60a5fa);
  transition: width 0.3s ease;
}

.chart-bar-value {
  text-align: right;
  color: #111827;
  font-weight: 600;
}

.pie-chart-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pie-chart {
  width: 160px;
  height: 160px;
  transform: rotate(-90deg);
}

.pie-ring {
  fill: none;
  stroke: #f1f5f9;
  stroke-width: 3;
}

.pie-slice {
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.pie-legend-wrapper {
  flex: 1;
}

.pie-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.9rem;
}

.pie-legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.pie-legend-color {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

.pie-legend-label {
  flex: 1;
  color: #4b5563;
}

.pie-legend-value {
  color: #111827;
  font-weight: 600;
}

.table-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
}

.table-search-input {
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.table-select {
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
  background-color: #fff;
}

.items-table-wrapper {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.items-table th,
.items-table td {
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #eee;
  text-align: left;
  font-size: 0.9rem;
}

.items-table th {
  background-color: #f9fafb;
  font-weight: 600;
}

.btn {
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  margin-right: 0.4rem;
}

.btn-detail {
  background-color: #0ea5e9;
  color: #fff;
}

.btn-edit {
  background-color: #6366f1;
  color: #fff;
}

.btn-approve {
  background-color: #16a34a;
  color: #fff;
}

.btn-reject {
  background-color: #f97316;
  color: #fff;
}

.btn-delete {
  background-color: #dc2626;
  color: #fff;
}

.btn-close {
  background-color: #6b7280;
  color: #fff;
}

.link-btn {
  padding: 0;
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 0.9rem;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
}

.status-badge.AVAILABLE {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.status-badge.PENDING {
  background-color: rgba(234, 179, 8, 0.1);
  color: #ca8a04;
}

.status-badge.REJECTED {
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.empty-text {
  color: #666;
  font-size: 0.95rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  width: 100%;
  max-width: 720px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.modal-close {
  border: none;
  background: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1rem;
}

.edit-main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-images {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.image-upload-area {
  position: relative;
  border: 1px dashed #cbd5f5;
  border-radius: 6px;
  padding: 0.75rem;
  background-color: #f9fafb;
  cursor: pointer;
}

.image-upload-area input[type="file"] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-button {
  text-align: center;
  color: #4b5563;
  font-size: 0.85rem;
}

.upload-button p {
  margin: 0;
}

.upload-button .help-text {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #9ca3af;
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.image-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.image-preview img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: none;
  background-color: rgba(15, 23, 42, 0.7);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.edit-input,
.edit-textarea {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
}

.edit-textarea {
  resize: vertical;
  min-height: 80px;
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.price-symbol {
  color: #6b7280;
  font-size: 0.9rem;
}

.error-text {
  color: #dc2626;
  font-size: 0.8rem;
}

.modal-main {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1rem;
}

.modal-image img {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.modal-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-field {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.field-label {
  min-width: 60px;
  color: #6b7280;
}

.field-value {
  color: #111827;
}

.modal-description {
  margin-top: 1rem;
}

.modal-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-sidebar {
    flex-direction: row;
    overflow-x: auto;
  }

  .modal-main {
    grid-template-columns: 1fr;
  }

  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
