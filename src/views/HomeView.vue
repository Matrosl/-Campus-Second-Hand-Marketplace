<template>
  <div class="home-container">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="fade-in">校园二手交易平台</h1>
        <p class="fade-in" style="animation-delay: 0.2s;">在您的大学校园内轻松买卖二手物品，环保又省钱！</p>
        <div class="hero-cta fade-in" style="animation-delay: 0.4s;">
          <router-link
            v-if="!isLoggedIn"
            to="/register"
            class="btn btn-primary hover-lift"
          >
            立即加入
          </router-link>
          <router-link
            :to="isLoggedIn ? '/items' : '/items'"
            class="btn btn-secondary hover-lift"
          >
            浏览物品
          </router-link>
        </div>
        <div class="hero-stats fade-in" style="animation-delay: 0.6s;">
          <div class="stat-item stat-animation">
            <div class="stat-number">{{ stats.users }}</div>
            <div class="stat-label">注册用户</div>
          </div>
          <div class="stat-item stat-animation" style="animation-delay: 0.2s;">
            <div class="stat-number">{{ stats.items }}</div>
            <div class="stat-label">在售物品</div>
          </div>
          <div class="stat-item stat-animation" style="animation-delay: 0.4s;">
            <div class="stat-number">{{ stats.transactions }}</div>
            <div class="stat-label">完成交易</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <h2>平台特色</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a6fa5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h3>使用便捷</h3>
          <p>简单直观的界面，方便您快速发布和浏览物品</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a6fa5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3>安全交易</h3>
          <p>经过验证的用户和安全的消息系统，确保交易安全可靠</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a6fa5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3>大学社区</h3>
          <p>与您所在大学的学生、教师和工作人员建立联系</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a6fa5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 5 5 12"></polyline>
            </svg>
          </div>
          <h3>快速响应</h3>
          <p>即时消息通知，让您随时了解交易动态</p>
        </div>
      </div>
    </section>

    <!-- Popular Items Section -->
    <section class="popular-items-section">
      <h2>热门物品</h2>
      <div class="items-grid">
        <div class="item-card" v-for="item in popularItems" :key="item.id" @click="navigateToItem(item.id)">
          <div class="item-image">
            <img :src="item.image" :alt="item.title">
            <span class="item-condition" :class="getConditionClass(item.condition)">
              {{ getConditionText(item.condition) }}
            </span>
          </div>
          <div class="item-info">
            <div class="item-category">{{ item.category }}</div>
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-price">¥{{ item.price.toFixed(2) }}</p>
            <div class="item-meta">
              <span class="item-location">{{ item.location }}</span>
              <span class="item-time">{{ item.time }}</span>
            </div>
           
          </div>
        </div>
      </div>
      <div class="view-all-link">
        <router-link to="/items">查看全部物品 <span>→</span></router-link>
      </div>
    </section>



    <!-- CTA Section -->
    <section
      v-if="!isLoggedIn"
      class="cta-section"
    >
      <div class="cta-content">
        <h2>准备好开始交易了吗？</h2>
        <p>加入我们的校园社区，轻松买卖二手物品</p>
        <router-link to="/register" class="btn btn-primary">立即注册</router-link>
      </div>
    </section>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'HomeView',
  data() {
    return {
      isLoggedIn: false,
      stats: {
        users: 0,
        items: 0,
        transactions: 0
      },
      popularItems: [],
      loading: false,
      error: null
    }
  },
  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem('token');
      this.isLoggedIn = !!token;
    },
    navigateToItem(itemId) {
      this.$router.push(`/item/${itemId}`)
    },
    async fetchStatistics() {
      try {
        const response = await api.statistics.getStatistics();
        this.stats.users = response.data.totalUsers || 0;
        this.stats.items = response.data.availableItems || 0;
        this.stats.transactions = response.data.completedTransactions || 0;
      } catch (error) {
        console.error('获取统计数据失败:', error);
        this.stats.users = 0;
        this.stats.items = 0;
        this.stats.transactions = 0;
      }
    },
    async fetchPopularItems() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await api.statistics.getPopularItems(6);
        this.popularItems = response.data.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          location: item.location,
          rating: item.rating || 0,
          ratingCount: item.ratingCount || 0,
          category: item.category.name || item.category,
          condition: item.itemCondition || item.condition,
          time: this.getRelativeTime(item.createdAt),
          image: item.images && item.images.length > 0 ? item.images[0].imageUrl : 'https://via.placeholder.com/300x200?text=物品图片'
        }));
      } catch (error) {
        console.error('获取热门物品失败:', error);
        this.error = '获取物品数据失败，请稍后重试';
        this.popularItems = [];
      } finally {
        this.loading = false;
      }
    },
    getRelativeTime(dateString) {
      if (!dateString) return '刚刚';
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
        return `${Math.floor(diffInSeconds / 604800)}周前`;
      }
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
        'fair': '七成新',
        'FAIR': '七成新',
        'Acceptable': '七成新',
        'ACCEPTABLE': '七成新',
        'poor': '六成新以下',
        'POOR': '六成新以下'
      };
      return conditions[conditionKey] || conditionKey || '未知';
    },
    getConditionClass(conditionKey) {
      if (!conditionKey) return '';
      const conditionMap = {
        'new': 'condition-new',
        'NEW': 'condition-new',
        'like-new': 'condition-like-new',
        'LIKE_NEW': 'condition-like-new',
        'like_new': 'condition-like-new',
        'good': 'condition-good',
        'GOOD': 'condition-good',
        'fair': 'condition-fair',
        'FAIR': 'condition-fair',
        'Acceptable': 'condition-fair',
        'ACCEPTABLE': 'condition-fair',
        'poor': 'condition-poor',
        'POOR': 'condition-poor'
      };
      return conditionMap[conditionKey] || '';
    }
  },
  mounted() {
    this.checkLoginStatus();
    this.fetchStatistics();
    this.fetchPopularItems();
  }
}
</script>

<style scoped>
/* 整体容器 */
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero 区域 */
.hero-section {
  background: linear-gradient(135deg, #4a6fa5 0%, #5c8cd2 100%);
  color: white;
  padding: 4rem 2rem;
  border-radius: 8px;
  margin: 2rem 0;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.hero-content h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.hero-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-cta {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  opacity: 0.9;
  font-size: 0.9rem;
}

/* 功能区域 */
.features-section {
  margin: 4rem 0;
  text-align: center;
}

.features-section h2 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  margin-bottom: 1rem;
  color: #4a6fa5;
}

.feature-card h3 {
  color: #4a6fa5;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

/* 热门物品区域 */
.popular-items-section {
  margin: 4rem 0;
  text-align: center;
}

.popular-items-section h2 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.item-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.item-image {
  height: 200px;
  overflow: hidden;
  position: relative;
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

.item-condition {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #4a6fa5;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}

.item-info {
  padding: 1.5rem;
  text-align: left;
}

.item-category {
  background-color: #f0f2f5;
  color: #4a6fa5;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  display: inline-block;
  margin-bottom: 0.8rem;
  font-weight: bold;
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
  margin-bottom: 0.8rem;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  font-size: 0.9rem;
}

.item-location {
  color: #666;
}

.item-time {
  color: #999;
}

.item-ratings {
  color: #ffc107;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.star {
  margin-right: 2px;
}

.rating-count {
  color: #999;
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

.view-all-link {
  margin-top: 2rem;
}

.view-all-link a {
  color: #4a6fa5;
  text-decoration: none;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s;
}

.view-all-link a:hover {
  color: #3a5a85;
}

.view-all-link span {
  font-size: 1.2rem;
}

/* 用户评价区域 */
.testimonials-section {
  background-color: #f9f9f9;
  padding: 4rem 2rem;
  border-radius: 8px;
  margin: 4rem 0;
}

.testimonials-section h2 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
  text-align: center;
}

.testimonials-container {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  overflow: hidden;
}

.testimonial-slider {
  display: flex;
  gap: 2rem;
  transition: transform 0.3s ease;
}

.testimonial-slide {
  flex: 0 0 320px;
}

.testimonial-card {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  text-align: left;
  height: 100%;
}

.testimonial-ratings {
  color: #ffc107;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.testimonial-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-style: italic;
  min-height: 80px;
}

.testimonial-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background-color: #4a6fa5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: bold;
  color: #333;
}

.user-role {
  color: #666;
  font-size: 0.9rem;
}

.testimonial-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  color: #4a6fa5;
  border: 2px solid #4a6fa5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover {
  background-color: #4a6fa5;
  color: white;
  transform: scale(1.1);
}

.testimonial-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e0e0e0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.indicator.active {
  background-color: #4a6fa5;
}

/* CTA 区域 */
.cta-section {
  background: linear-gradient(135deg, #4a6fa5 0%, #5c8cd2 100%);
  color: white;
  padding: 4rem 2rem;
  border-radius: 8px;
  margin: 4rem 0;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.cta-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* 按钮样式 */
.btn {
  display: inline-block;
  padding: 0.8rem 2rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: all 0.3s;
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
  background-color: #f4f4f4;
  color: #4a6fa5;
  border: 2px solid #4a6fa5;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 1rem;
  }
  
  .hero-content h1 {
    font-size: 2rem;
  }
  
  .hero-content p {
    font-size: 1rem;
  }
  
  .hero-cta {
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .hero-stats {
    gap: 2rem;
    padding-top: 1.5rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .features-section, .popular-items-section, .testimonials-section, .cta-section {
    margin: 2rem 0;
  }
  
  .features-section h2, .popular-items-section h2, .testimonials-section h2, .cta-section h2 {
    font-size: 1.5rem;
  }
  
  .features-grid, .items-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .feature-card, .testimonial-card {
    padding: 1.5rem;
  }
  
  .testimonials-section {
    padding: 2rem 1rem;
  }
  
  .testimonials-container {
    max-width: 100%;
  }
  
  .testimonial-slide {
    flex: 0 0 calc(100% - 1rem);
  }
  
  .testimonial-card {
    margin: 0 0.5rem;
  }
  
  .cta-section {
    padding: 2rem 1rem;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
  }
}
</style>
