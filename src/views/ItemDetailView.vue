<template>
  <div class="item-detail-container">
    <div class="back-button fade-in">
      <button class="btn btn-secondary hover-lift" @click="goBack">&larr; 返回物品列表</button>
    </div>
    
    <div class="item-detail-content" v-if="loading">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载物品详情中...</p>
      </div>
    </div>
    
    <div class="item-detail-content" v-else-if="error">
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2>加载失败</h2>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="retryLoad">重新加载</button>
        <button class="btn btn-secondary" @click="goBack">返回列表</button>
      </div>
    </div>
    
    <div class="item-detail-content" v-else>
      <!-- 物品图片和信息 -->
      <div class="item-main-info">
        <div class="item-images fade-in" style="animation-delay: 0.2s;">
            <div class="main-image" @click="openImageZoom">
              <img :src="currentImage.imageUrl" :alt="item.title" class="zoomable">
              <div class="zoom-indicator">+</div>
            </div>
            <div class="thumbnail-images">
              <div class="thumbnail" v-for="(image, index) in item.images" :key="index" @click="setCurrentImage(image)" :class="{ active: currentImage.imageUrl === image.imageUrl }">
                <img :src="image.imageUrl" :alt="`${item.title} 图片 ${index + 1}`">
              </div>
            </div>
          </div>
        
        <div class="item-details fade-in" style="animation-delay: 0.4s;">
          <div class="item-status">
            <span v-if="isAvailable" class="status-available">在售</span>
            <span v-else class="status-sold">已售出</span>
          </div>
          <h1 class="item-title">{{ item.title }}</h1>
          <p class="item-price">¥{{ item.price.toFixed(2) }}</p>
          
          <div class="item-meta">
            <div class="meta-item">
              <span class="meta-label">分类：</span>
              <span class="meta-value">{{ item.category.name }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">新旧程度：</span>
              <span class="meta-value condition-badge" :class="getConditionClass(item.condition)">
                {{ getConditionText(item.condition) }}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">发布时间：</span>
              <span class="meta-value">{{ formatDate(item.createdAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">交易地点：</span>
              <span class="meta-value">{{ item.location }}</span>
            </div>
          </div>
          
          <!-- 卖家信息 -->
          <div class="seller-info">
            <div class="seller-avatar">
              <img
                v-if="item.seller.avatarUrl"
                :src="item.seller.avatarUrl"
                :alt="item.seller.realName || item.seller.username"
              />
              <span v-else>{{ (item.seller.realName || item.seller.username || '用')[0] }}</span>
            </div>
            <div class="seller-details">
              <h3 class="seller-name">{{ item.seller.realName || item.seller.username }}</h3>
              <p class="seller-role">{{ item.seller.university }}</p>
            </div>
            <button class="btn btn-primary contact-seller-btn" @click="contactSeller">
              联系卖家
            </button>
          </div>
          
          <!-- 操作按钮 -->
          <div class="item-actions">
            <button class="btn btn-primary" v-if="item.isAvailable" @click="makeOffer">
              发起交易
            </button>
            <button class="btn btn-secondary" @click="addToFavorites">
              {{ isFavorite ? '取消收藏' : '收藏物品' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- 物品描述 -->
      <div class="item-description fade-in" style="animation-delay: 0.6s;">
        <h2>物品描述</h2>
        <p>{{ item.description }}</p>
      </div>
      
      <!-- 用户评价已移除 -->
      <!-- 相似物品推荐 -->
      <div class="similar-items fade-in" style="animation-delay: 1.0s;">
        <h2>相似物品</h2>
        <div class="similar-items-grid">
          <div class="similar-item-card" 
            v-for="similarItem in similarItems" 
            :key="similarItem.id"
            @click="navigateToItem(similarItem.id)"
          >
            <div class="similar-item-image">
              <img :src="similarItem.images && similarItem.images.length > 0 ? similarItem.images[0].imageUrl : 'https://via.placeholder.com/300x200?text=暂无图片'" :alt="similarItem.title">
            </div>
            <div class="similar-item-info">
              <h3 class="similar-item-title">{{ similarItem.title }}</h3>
              <p class="similar-item-price">¥{{ similarItem.price.toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片放大模态框 -->
    <div class="modal" v-if="showImageZoom">
      <div class="modal-content image-zoom-modal" @click="closeImageZoom">
        <button class="close-btn" @click.stop="closeImageZoom">&times;</button>
        <div class="zoom-content">
          <img :src="zoomImage" :alt="item.title" class="zoom-image">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'ItemDetailView',
  data() {
    return {
      item: {
        id: 0,
        title: '',
        price: 0,
        images: [],
        category: '',
        condition: '',
        location: '',
        status: '',
        createdAt: '',
        description: '',
        seller: {
          id: 0,
          username: '',
          university: '',
          rating: 0,
          reviewCount: 0
        },
        reviews: []
      },
      similarItems: [],
      isFavorite: false,
      showImageZoom: false,
      zoomImage: '',
      loading: true,
      error: null
    }
  },
  computed: {
    universityId() {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.universityId || 1;
    },
    currentImage() {
      return this.item.images && this.item.images.length > 0 ? this.item.images[0] : { imageUrl: 'https://via.placeholder.com/600x400?text=暂无图片' };
    },
    isAvailable() {
      return this.item.status === 'AVAILABLE';
    }
  },
  mounted() {
    const itemId = this.$route.params.id;
    if (itemId) {
      this.loadItemDetail(itemId);
      this.loadSimilarItems(itemId);
    }
  },
  methods: {
    async loadItemDetail(itemId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.item.getById(itemId);
        const data = response.data || {};

        const seller = data.user || {};
        const university = data.university || {};

        this.item = {
          ...this.item,
          ...data,
          condition: data.itemCondition || data.condition || '',
          category: data.category || this.item.category,
          images: data.images || [],
          seller: {
            id: seller.id || 0,
            username: seller.username || seller.realName || '匿名用户',
            realName: seller.realName || '',
            avatarUrl: seller.avatarUrl || '',
            university: university.name || seller.universityName || '未知学校',
            rating: seller.rating || 0,
            reviewCount: seller.reviewCount || 0
          },
          reviews: this.item.reviews || []
        };

        if (!this.item.images) {
          this.item.images = [];
        }

        if (!this.item.reviews) {
          this.item.reviews = [];
        }

        if (!this.isAvailable) {
          this.error = '该物品尚未通过审核或已下架，暂不可查看详情';
        }
      } catch (error) {
        console.error('加载商品详情失败:', error);
        this.error = '加载商品详情失败，请稍后重试';
        if (error.response && error.response.status === 403) {
          this.error = '您无权查看此物品，该物品不属于您的学校';
        }
      } finally {
        this.loading = false;
      }
    },
    retryLoad() {
      const itemId = this.$route.params.id;
      if (itemId) {
        this.loadItemDetail(itemId);
        this.loadSimilarItems(itemId);
      }
    },
    async loadSimilarItems(itemId) {
      try {
        const response = await api.item.getSimilarItems(itemId);
        let items = response.data.content || response.data;

        if (!Array.isArray(items)) {
          items = [];
        }

        this.similarItems = items.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price || 0,
          location: item.location,
          rating: item.rating || 0,
          ratingCount: item.ratingCount || 0,
          category: item.category,
          condition: item.itemCondition || item.condition,
          createdAt: item.createdAt,
          images: item.images || []
        }));
      } catch (error) {
        console.error('加载相似商品失败:', error);
        this.similarItems = [];
      }
    },
    goBack() {
      this.$router.go(-1);
    },
    setCurrentImage(image) {
      // 更新当前显示图片
      if (this.item.images && this.item.images.length > 0) {
        const index = this.item.images.findIndex(img => img.imageUrl === image.imageUrl);
        if (index !== -1) {
          // 将选中的图片移到数组第一位
          this.item.images.splice(index, 1);
          this.item.images.unshift(image);
        }
      }
    },
    openImageZoom() {
      this.showImageZoom = true;
      this.zoomImage = this.currentImage.imageUrl;
    },
    closeImageZoom() {
      this.showImageZoom = false;
    },
    contactSeller() {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (!userInfo.id) {
        this.$router.push({
          path: '/login',
          query: { redirect: this.$route.fullPath }
        });
        return;
      }

      if (this.item.seller && this.item.seller.id && userInfo.id === this.item.seller.id) {
        alert('这是您发布的物品，无需给自己发送消息');
        return;
      }

      if (this.item.seller && this.item.seller.id) {
        this.$router.push({
          path: '/messages',
          query: {
            sellerId: this.item.seller.id,
            sellerName: this.item.seller.realName || this.item.seller.username,
            sellerAvatar: this.item.seller.avatarUrl || '',
            itemId: this.item.id
          }
        });
      }
    },
    async makeOffer() {
      // 发起交易逻辑
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (!userInfo.id) {
          this.$router.push('/login');
          return;
        }
        
        const response = await api.transaction.create({
          itemId: this.item.id,
          buyerId: userInfo.id,
          sellerId: this.item.seller.id
        }, this.universityId);
        
        alert('交易请求已发送！');
        this.$router.push('/transactions');
      } catch (error) {
        console.error('发起交易失败:', error);
        alert('发起交易失败，请稍后重试');
      }
    },
    async addToFavorites() {
      // 添加到收藏逻辑
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (!userInfo.id) {
          this.$router.push('/login');
          return;
        }
        
        if (this.isFavorite) {
          // 取消收藏
          await api.favorite.delete(userInfo.id, this.item.id);
        } else {
          // 添加收藏
          await api.favorite.create(userInfo.id, this.item.id);
        }
        
        this.isFavorite = !this.isFavorite;
        alert(this.isFavorite ? '已添加到收藏' : '已取消收藏');
      } catch (error) {
        console.error('操作收藏失败:', error);
        alert('操作失败，请稍后重试');
      }
    },
    navigateToItem(itemId) {
      // 导航到其他物品详情页
      this.$router.push(`/item/${itemId}`);
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
    },
    formatDate(dateString) {
      // 格式化日期显示
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (days > 7) {
        // 超过一周，显示完整日期
        return date.toLocaleDateString();
      } else if (days > 0) {
        return `${days}天前`;
      } else if (hours > 0) {
        return `${hours}小时前`;
      } else if (minutes > 0) {
        return `${minutes}分钟前`;
      } else {
        return '刚刚';
      }
    }
  }
}
</script>

<style scoped>
/* 整体容器 */
.item-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 返回按钮 */
.back-button {
  margin-bottom: 2rem;
}

/* 主要内容 */
.item-detail-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

/* 物品图片和信息 */
.item-main-info {
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
}

/* 物品图片 */
.item-images {
  flex: 1;
}

.main-image {
  height: 500px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 1rem;
  position: relative;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-images {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.thumbnail:hover {
  border-color: #4a6fa5;
}

.thumbnail.active {
  border-color: #4a6fa5;
  background-color: rgba(74, 111, 165, 0.1);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 物品详情 */
.item-details {
  flex: 1;
  min-width: 300px;
}

.item-status {
  margin-bottom: 1rem;
}

.status-available {
  background-color: #4CAF50;
  color: white;
  padding: 0.3rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
}

.status-sold {
  background-color: #F44336;
  color: white;
  padding: 0.3rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
}

.item-title {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.item-ratings {
  color: #ffc107;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.star {
  margin-right: 5px;
}

.rating-count {
  color: #999;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.item-price {
  color: #4a6fa5;
  font-weight: bold;
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

.item-meta {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.meta-item {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-label {
  color: #666;
  width: 100px;
  font-weight: bold;
}

.meta-value {
  color: #333;
  flex: 1;
}

/* 卖家信息 */
.seller-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.seller-avatar {
  width: 60px;
  height: 60px;
  background-color: #4a6fa5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  overflow: hidden;
}

.seller-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.seller-details {
  flex: 1;
}

.seller-name {
  color: #333;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}

.seller-role {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.seller-ratings {
  color: #ffc107;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.seller-rating-count {
  color: #999;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.contact-seller-btn {
  margin-left: auto;
}

/* 操作按钮 */
.item-actions {
  display: flex;
  gap: 1rem;
}

/* 物品描述 */
.item-description {
  margin-bottom: 3rem;
}

.item-description h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.item-description p {
  color: #666;
  line-height: 1.6;
  font-size: 1.1rem;
}

/* 用户评价 */
.item-reviews {
  margin-bottom: 3rem;
}

.item-reviews h2 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.review-card {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  background-color: #4a6fa5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.reviewer-name {
  color: #333;
  font-weight: bold;
}

.review-rating {
  color: #ffc107;
  font-size: 0.9rem;
}

.review-content {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.review-date {
  color: #999;
  font-size: 0.8rem;
  text-align: right;
}

.add-review-section {
  text-align: center;
}

/* 相似物品 */
.similar-items {
  margin-bottom: 2rem;
}

.similar-items h2 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.similar-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.similar-item-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.similar-item-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.similar-item-image {
  height: 150px;
  overflow: hidden;
}

.similar-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.similar-item-card:hover .similar-item-image img {
  transform: scale(1.05);
}

.similar-item-info {
  padding: 1rem;
}

.similar-item-title {
  color: #333;
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-item-price {
  color: #4a6fa5;
  font-weight: bold;
  font-size: 1.2rem;
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: #f0f0f0;
}

.modal-body {
  padding: 1.5rem;
}

.rating-input {
  margin-bottom: 1.5rem;
}

.rating-input label {
  display: block;
  color: #333;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.star-rating {
  font-size: 2rem;
  color: #ffc107;
  cursor: pointer;
}

.star-rating .star:hover {
  transform: scale(1.2);
}

.review-content-input {
  margin-bottom: 1.5rem;
}

.review-content-input label {
  display: block;
  color: #333;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.review-content-input textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
}

.review-content-input textarea:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

/* 图片放大相关样式 */
.zoomable {
  cursor: zoom-in;
  transition: transform 0.3s ease;
}

.zoomable:hover {
  transform: scale(1.02);
}

.zoom-indicator {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.zoom-indicator:hover {
  opacity: 1;
}

.image-zoom-modal {
  background-color: rgba(0, 0, 0, 0.9);
  border: none;
  border-radius: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.image-zoom-modal .close-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 1001;
}

.image-zoom-modal .close-btn:hover {
  background-color: rgba(0, 0, 0, 0.9);
}

.zoom-content {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}

.zoom-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  cursor: zoom-out;
}

/* 物品新旧程度标签样式 */
.condition-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  color: white;
  display: inline-block;
}

.condition-new {
  background-color: #28a745;
}

.condition-like-new {
  background-color: #007bff;
}

.condition-good {
  background-color: #ffc107;
  color: #333;
}

.condition-fair {
  background-color: #fd7e14;
}

.condition-poor {
  background-color: #dc3545;
}

/* 按钮样式 */
.btn {
  display: inline-block;
  padding: 0.8rem 2rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-size: 1rem;
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

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  .item-detail-container {
    padding: 1rem;
  }
  
  .item-detail-content {
    padding: 1rem;
  }
  
  .item-main-info {
    flex-direction: column;
  }
  
  .main-image {
    height: 300px;
  }
  
  .item-title {
    font-size: 1.5rem;
  }
  
  .item-price {
    font-size: 2rem;
  }
  
  .seller-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .contact-seller-btn {
    margin-left: 0;
    width: 100%;
  }
  
  .item-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    text-align: center;
  }
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #4a6fa5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  font-size: 1.1rem;
}

/* 错误状态样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.error-container h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.error-container p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  max-width: 400px;
}

.error-container .btn {
  margin: 0.5rem;
}

.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.modal-content {
  width: 95%;
  margin: 1rem;
}

/* 移动端图片放大优化 */
.image-zoom-modal {
  padding: 0.5rem;
}

.zoom-image {
  max-height: 80vh;
}

.image-zoom-modal .close-btn {
  top: 10px;
  right: 10px;
  width: 25px;
  height: 25px;
  font-size: 1.2rem;
}

/* 移动端评价输入优化 */
.star-rating {
  font-size: 1.5rem;
}

.review-content-input textarea {
  min-height: 120px;
}
</style>
