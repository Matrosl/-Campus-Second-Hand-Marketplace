<template>
  <div class="items-container">
    <h2>浏览物品</h2>
    
    <!-- 搜索和筛选区域 -->
    <div class="search-filter-section">
      <!-- 搜索框 -->
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="搜索物品..." 
          class="search-input"
          @keyup.enter="applyFilters"
        >
      </div>
      
      <!-- 高级筛选 -->
      <div class="advanced-filters">
        <!-- 分类筛选 -->
        <div class="filter-group">
          <label>分类</label>
          <select 
            v-model="selectedCategory"
            class="filter-select"
          >
            <option value="">全部分类</option>
            <option 
              v-for="category in categories" 
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <!-- 价格范围筛选 -->
        <div class="filter-group">
          <label>价格范围</label>
          <div class="price-range">
            <input 
              type="number" 
              v-model="minPrice"
              placeholder="最低"
              class="price-input"
              min="0"
            >
            <span class="price-separator">-</span>
            <input 
              type="number" 
              v-model="maxPrice"
              placeholder="最高"
              class="price-input"
              min="0"
            >
          </div>
        </div>
        
        <!-- 位置筛选 -->
        <div class="filter-group">
          <label>位置</label>
          <select 
            v-model="selectedLocation"
            class="filter-select"
          >
            <option value="">全部位置</option>
            <option 
              v-for="location in locations" 
              :key="location"
              :value="location"
            >
              {{ location }}
            </option>
          </select>
        </div>
        
        <!-- 状态筛选 -->
        <div class="filter-group">
          <label>状态</label>
          <select 
            v-model="selectedCondition"
            class="filter-select"
          >
            <option value="">全部状态</option>
            <option value="new">全新</option>
            <option value="like_new">九成新</option>
            <option value="good">八成新</option>
            <option value="Acceptable">七成新</option>
            <option value="poor">六成新以下</option>
          </select>
        </div>
        
        <!-- 操作按钮 -->
        <div class="filter-actions">
          <button class="btn btn-primary" @click="applyFilters">应用筛选</button>
          <button class="btn btn-secondary" @click="resetFilters">重置</button>
        </div>
      </div>
      
      <!-- 排序选项 -->
      <div class="sort-options">
        <label>排序：</label>
        <select 
          v-model="sortOption"
          class="sort-select"
          @change="applySort"
        >
          <option value="newest">最新发布</option>
          <option value="price-low">价格从低到高</option>
          <option value="price-high">价格从高到低</option>
          <option value="rating">评分最高</option>
        </select>
      </div>
      
      <!-- 已选筛选条件 -->
      <div class="active-filters" v-if="activeFilters.length > 0">
        <span class="filter-label">已选筛选：</span>
        <div 
          v-for="filter in activeFilters" 
          :key="filter.key"
          class="filter-tag"
        >
          {{ filter.value }}
          <span class="filter-remove" @click="removeFilter(filter.key)">&times;</span>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchItems">重试</button>
    </div>
    
    <div v-else-if="filteredItems.length === 0" class="no-items">
      <p>没有找到匹配的物品</p>
      <router-link to="/sell" class="btn btn-primary">发布新物品</router-link>
    </div>
    
    <div v-else class="items-grid" :class="{ 'items-grid-center': filteredItems.length === 3 }">
      <div 
        class="item-card" 
        v-for="item in filteredItems" 
        :key="item.id"
        @click="navigateToItem(item.id)"
      >
        <div class="item-image">
          <img :src="item.images && item.images.length > 0 ? item.images[0].imageUrl : 'https://via.placeholder.com/300x200?text=暂无图片'" :alt="item.title">
          <span class="item-condition-badge" :class="getConditionClass(item.itemCondition)">{{ getConditionText(item.itemCondition) }}</span>
        </div>
        <div class="item-info">
          <h3 class="item-title">{{ item.title }}</h3>
          <p class="item-price">¥{{ (item.price || 0).toFixed(2) }}</p>
          <p class="item-category">{{ getItemCategory(item.category) }}</p>
          <p class="item-location">{{ item.location || item.meetingLocation || '校内交易' }}</p>
          <div class="item-meta">
            
            <span class="item-time">{{ formatDate(item.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="btn btn-secondary" 
        :disabled="currentPage === 0"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <button
        v-for="page in visiblePages"
        :key="page"
        class="btn page-btn"
        :class="{ 'page-btn-active': page - 1 === currentPage }"
        @click="changePage(page - 1)"
      >
        {{ page }}
      </button>
      <button 
        class="btn btn-secondary" 
        :disabled="currentPage >= totalPages - 1"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'ItemsView',
  data() {
    return {
      items: [],
      categories: [],
      locations: [],
      loading: false,
      error: null,
      currentPage: 0,
      pageSize: 12,
      totalPages: 0,
      totalItems: 0,
      searchQuery: '',
      selectedCategory: '',
      minPrice: '',
      maxPrice: '',
      selectedLocation: '',
      selectedCondition: '',
      sortOption: 'newest',
      filteredItems: [],
      activeFilters: []
    }
  },
  async mounted() {
    await Promise.all([
      this.fetchItems(),
      this.fetchCategories(),
      this.fetchLocations()
    ]);
  },
  computed: {
    visiblePages() {
      const pages = [];
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
  },
  methods: {
    async fetchItems() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.item.getAll(this.currentPage, this.pageSize);
        this.items = response.data.content || response.data;
        this.totalPages = response.data.totalPages || 0;
        this.totalItems = response.data.totalElements || 0;
        this.filteredItems = [...this.items];
      } catch (error) {
        console.error('获取物品列表失败:', error);
        this.error = '加载物品失败，请稍后重试';
        this.filteredItems = [];
      } finally {
        this.loading = false;
      }
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
    async fetchLocations() {
      try {
        const response = await api.item.getLocations();
        this.locations = response.data || [];
      } catch (error) {
        console.error('获取位置列表失败:', error);
        this.locations = [];
      }
    },
    async applyFilters(resetPage = true) {
      if (resetPage) {
        this.currentPage = 0;
      }
      this.loading = true;
      this.error = null;
      try {
        let response;
        
        // 构建筛选参数
        const categoryId = this.selectedCategory ? Number(this.selectedCategory) : null;
        const minPrice = this.minPrice ? parseFloat(this.minPrice) : null;
        const maxPrice = this.maxPrice ? parseFloat(this.maxPrice) : null;
        
        // 如果有搜索查询，先搜索，然后再应用筛选
        if (this.searchQuery && this.searchQuery.trim()) {
          response = await api.item.search(this.searchQuery, this.currentPage, this.pageSize);
        } else {
          // 否则直接使用筛选API
          response = await api.item.filter(
            categoryId,
            this.selectedCondition,
            minPrice,
            maxPrice,
            this.selectedLocation,
            this.currentPage,
            this.pageSize
          );
        }
        
        // 应用服务器端筛选结果
        let serverFilteredItems = response.data.content || response.data;
        
        // 如果返回的是数组，确保它是一个标准的数组
        if (!Array.isArray(serverFilteredItems)) {
          serverFilteredItems = [];
        }
        
        this.items = serverFilteredItems;
        this.totalPages = response.data.totalPages || 0;
        this.totalItems = response.data.totalElements || 0;
        
        // 只使用服务器端筛选结果
        this.filteredItems = serverFilteredItems;
        
        // 应用排序
        this.sortItems();
        
        // 更新已选筛选条件显示
        this.updateActiveFilters();
      } catch (error) {
        console.error('筛选物品失败:', error);
        this.error = '筛选失败，请稍后重试';
        this.filteredItems = [];
      } finally {
        this.loading = false;
      }
    },
    async resetFilters() {
      this.searchQuery = '';
      this.selectedCategory = '';
      this.minPrice = '';
      this.maxPrice = '';
      this.selectedLocation = '';
      this.selectedCondition = '';
      this.sortOption = 'newest';
      this.currentPage = 0;
      await this.fetchItems();
      // 更新已选筛选条件显示
      this.updateActiveFilters();
    },
    getItemCategory(categoryData) {
      if (!categoryData) return '其他';
      
      // 如果categoryData是对象，直接返回name
      if (typeof categoryData === 'object' && categoryData.name) {
        return categoryData.name;
      }
      
      // 如果categoryData是ID，则从categories数组中查找
      if (typeof categoryData === 'number' || !isNaN(categoryData)) {
        const category = this.categories.find(c => c.id === Number(categoryData));
        return category ? category.name : '其他';
      }
      
      // 如果是字符串，尝试从硬编码映射中查找
      const categoryMappings = {
        'ELECTRONICS': '电子产品',
        'ELECTRONIC': '电子产品',
        'textbooks': '教材',
        'TEXTBOOKS': '教材',
        'TEXTBOOK': '教材',
        'furniture': '家具',
        'FURNITURE': '家具',
        'clothing': '服装',
        'CLOTHING': '服装',
        'sports': '运动用品',
        'SPORTS': '运动用品',
        'other': '其他',
        'OTHER': '其他'
      };
      
      return categoryMappings[categoryData] || categoryData || '其他';
    },
    getConditionText(conditionKey) {
      if (!conditionKey) return '未知';
      const conditions = {
        'new': '全新',
        'NEW': '全新',
        'like-new': '九成新',
        'LIKE_NEW': '九成新',
        'like_new': '九成新',
        'good': '八成新',
        'GOOD': '八成新',
        'Acceptable': '七成新',
        'ACCEPTABLE': '七成新',
        'poor': '六成新以下',
        'POOR': '六成新以下'
      };
      return conditions[conditionKey] || conditionKey || '未知';
    },
    getConditionClass(conditionKey) {
      if (!conditionKey) return '';
      const conditionClasses = {
        'new': 'condition-new',
        'NEW': 'condition-new',
        'like-new': 'condition-like-new',
        'LIKE_NEW': 'condition-like-new',
        'like_new': 'condition-like-new',
        'good': 'condition-good',
        'GOOD': 'condition-good',
        'Acceptable': 'condition-fair',
        'ACCEPTABLE': 'condition-fair',
        'poor': 'condition-poor',
        'POOR': 'condition-poor'
      };
      return conditionClasses[conditionKey] || '';
    },
    formatDate(dateString) {
      if (!dateString) return '未知时间';
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) {
        return '刚刚';
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}分钟前`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}小时前`;
      } else if (diffInSeconds < 604800) {
        return `${Math.floor(diffInSeconds / 86400)}天前`;
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    },
    sortItems() {
      switch (this.sortOption) {
        case 'newest':
          this.filteredItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'price-low':
          this.filteredItems.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          this.filteredItems.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          this.filteredItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
      }
    },
    applySort() {
      this.sortItems();
    },
    updateActiveFilters() {
      this.activeFilters = [];
      
      if (this.searchQuery) {
        this.activeFilters.push({ key: 'search', value: `搜索: ${this.searchQuery}` });
      }
      
      if (this.selectedCategory) {
        this.activeFilters.push({ key: 'category', value: `分类: ${this.getItemCategory(this.selectedCategory)}` });
      }
      
      if (this.minPrice || this.maxPrice) {
        const min = this.minPrice ? this.minPrice : '不限';
        const max = this.maxPrice ? this.maxPrice : '不限';
        this.activeFilters.push({ key: 'price', value: `价格: ${min}-${max}` });
      }
      
      if (this.selectedLocation) {
        this.activeFilters.push({ key: 'location', value: `位置: ${this.selectedLocation}` });
      }
      
      if (this.selectedCondition) {
        this.activeFilters.push({ key: 'condition', value: `状态: ${this.getConditionText(this.selectedCondition)}` });
      }
      
      if (this.sortOption !== 'newest') {
        const sortTexts = {
          'price-low': '价格从低到高',
          'price-high': '价格从高到低',
          'rating': '评分最高'
        };
        this.activeFilters.push({ key: 'sort', value: `排序: ${sortTexts[this.sortOption]}` });
      }
    },
    removeFilter(filterKey) {
      switch (filterKey) {
        case 'search':
          this.searchQuery = '';
          break;
        case 'category':
          this.selectedCategory = '';
          break;
        case 'price':
          this.minPrice = '';
          this.maxPrice = '';
          break;
        case 'location':
          this.selectedLocation = '';
          break;
        case 'condition':
          this.selectedCondition = '';
          break;
        case 'sort':
          this.sortOption = 'newest';
          break;
      }
      this.applyFilters();
    },
    async changePage(page) {
      if (page < 0 || (this.totalPages && page >= this.totalPages)) {
        return;
      }
      this.currentPage = page;
      const hasSearch = this.searchQuery && this.searchQuery.trim();
      const hasFilters = this.selectedCategory || this.minPrice || this.maxPrice || this.selectedLocation || this.selectedCondition;
      if (hasSearch || hasFilters) {
        await this.applyFilters(false);
      } else {
        await this.fetchItems();
      }
    },
    navigateToItem(itemId) {
      this.$router.push(`/item/${itemId}`);
    }
  }
}
</script>

<style scoped>
/* 整体容器 */
.items-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 标题样式 */
.items-container h2 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
  text-align: center;
}

/* 搜索和筛选区域 */
.search-filter-section {
  margin-bottom: 2rem;
}

/* 搜索框 */
.search-box {
  margin-bottom: 1.5rem;
  text-align: center;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

/* 高级筛选 */
.advanced-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
}

.filter-select {
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
  transition: border-color 0.3s;
}

.filter-select:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

/* 价格范围 */
.price-range {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.price-input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
  transition: border-color 0.3s;
}

.price-input:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

.price-separator {
  color: #666;
  font-weight: bold;
}

/* 筛选操作按钮 */
.filter-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

/* 排序选项 */
.sort-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.sort-options label {
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
}

.sort-select {
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
  transition: border-color 0.3s;
}

.sort-select:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

/* 已选筛选条件 */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-label {
  font-weight: bold;
  color: #333;
  align-self: center;
  margin-right: 0.5rem;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background-color: #4a6fa5;
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
}

.filter-remove {
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  line-height: 1;
}

.filter-remove:hover {
  opacity: 0.8;
}

/* 物品网格 */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 320px));
  gap: 2rem;
  justify-content: center;
}

.items-grid.items-grid-center {
  display: flex;
  justify-content: center;
}

/* 物品卡片 */
.item-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* 物品图片 */
.item-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.item-card:hover .item-image img {
  transform: scale(1.05);
}

/* 物品信息 */
.item-info {
  padding: 1.5rem;
  text-align: left;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  color: #4a6fa5;
  font-weight: bold;
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
}

.item-category {
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.item-location {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

/* 评分星星 */
.item-ratings {
  color: #ffc107;
  font-size: 0.9rem;
}

.star {
  margin-right: 2px;
}

/* 物品状态标签 */
.item-condition-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.condition-new {
  background-color: #28a745;
}

.condition-like-new {
  background-color: #007bff;
}

.condition-good {
  background-color: #17a2b8;
}

.condition-fair {
  background-color: #ffc107;
  color: #333;
}

.condition-poor {
  background-color: #dc3545;
}

/* 物品元信息 */
.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.item-time {
  font-size: 0.8rem;
  color: #999;
}

/* 无物品提示 */
.no-items {
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-top: 2rem;
}

.no-items p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-info {
  font-size: 0.9rem;
  color: #555;
}

.page-btn {
  background-color: #e9ecef;
  color: #333;
}

.page-btn:hover {
  background-color: #d6d8db;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.page-btn-active {
  background-color: #4a6fa5;
  color: #fff;
}

/* 按钮样式 */
.btn {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background-color: #4a6fa5;
  color: white;
}

.btn-primary:hover {
  background-color: #3a5a85;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .items-container {
    padding: 1rem;
  }
  
  .items-container h2 {
    font-size: 1.5rem;
  }
  
  .advanced-filters {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .filter-group {
    margin-bottom: 0;
  }
  
  .price-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .sort-options {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .active-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-label {
    margin-bottom: 0.5rem;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .item-card {
    margin: 0 auto;
    max-width: 300px;
  }
}
</style>
