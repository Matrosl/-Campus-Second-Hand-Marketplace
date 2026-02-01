<template>
  <div class="profile-container">
    <h2>用户资料</h2>
    
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>
    
    <div v-else class="profile-content">
      <div class="profile-info">
        <div class="profile-avatar" @click="openAvatarUpload">
          <img :src="user.profileImage" alt="用户头像" :style="{ opacity: avatarUploading ? 0.6 : 1 }">
          <input type="file" ref="avatarInput" accept="image/*" @change="handleAvatarUpload" style="display: none;">
          <div class="avatar-edit-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
          <div v-if="avatarUploading" class="avatar-uploading-overlay">
            <div class="uploading-spinner"></div>
            <span>上传中...</span>
          </div>
        </div>
        <div class="profile-details">
          <h3 class="profile-name">{{ user.realName || user.username }}</h3>
          <p class="profile-email">{{ user.email }}</p>
          <p class="profile-university">{{ user.studentId }}</p>
          <div class="profile-bio" v-if="user.bio">
            <p>{{ user.bio }}</p>
          </div>
          <div class="profile-rating">
            
          </div>
        </div>
        <button class="edit-profile-btn" @click="showEditModal = true">编辑资料</button>
      </div>
      
      <div class="profile-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'items' }"
          @click="activeTab = 'items'"
        >
          我的物品
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'purchases' }"
          @click="activeTab = 'purchases'"
        >
          我的购买
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'sales' }"
          @click="activeTab = 'sales'"
        >
          我的销售
        </button>
      </div>
      
      <div class="profile-tab-content">
        <div v-if="activeTab === 'items'" class="items-section">
          <div class="items-header">
            <h3>我的发布</h3>
            <router-link to="/sell" class="add-item-btn">添加新物品</router-link>
          </div>
          
          <div class="items-grid">
            <div class="item-card" v-for="item in userItems" :key="item.id">
              <router-link :to="'/item/' + item.id" class="item-link">
                <div class="item-image">
                  <img :src="item.images && item.images.length > 0 ? item.images[0].imageUrl : 'https://via.placeholder.com/300x200?text=暂无图片'" :alt="item.title">
                </div>
                <div class="item-info">
                  <h4 class="item-title">{{ item.title }}</h4>
                  <p class="item-price">¥{{ (item.price || 0).toFixed(2) }}</p>
                  <div class="item-status">
                    <span class="status-badge" :class="item.status">{{ item.status }}</span>
                  </div>
                </div>
              </router-link>
              <div class="item-actions">
                <button class="edit-item-btn" @click="editItem(item)">编辑</button>
                <button class="delete-item-btn" @click="deleteItem(item.id)">删除</button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="activeTab === 'purchases'" class="purchases-section">
          <h3>我的购买</h3>
          <div class="transactions-list">
            <div class="transaction-item" v-for="transaction in purchases" :key="transaction.id">
              <div class="transaction-info">
                <h4>{{ transaction.item }}</h4>
                <p class="transaction-date">购买日期：{{ transaction.date }}</p>
                <p class="transaction-seller">卖家：{{ transaction.seller }}</p>
              </div>
              <div class="transaction-details">
                <span class="transaction-price">¥{{ transaction.price }}</span>
                <span class="transaction-status" :class="transaction.status">{{ transaction.status }}</span>
                <button 
                  class="review-btn" 
                  v-if="transaction.status === '已完成' && !transaction.reviewed"
                  @click="showReviewModal = true; selectedTransaction = transaction"
                >
                  评价卖家
                </button>
                <button 
                  class="view-detail-btn"
                  @click="viewTransactionDetail(transaction)"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="activeTab === 'sales'" class="sales-section">
          <h3>我的销售</h3>
          <div class="transactions-list">
            <div class="transaction-item" v-for="transaction in sales" :key="transaction.id">
              <div class="transaction-info">
                <h4>{{ transaction.item }}</h4>
                <p class="transaction-date">销售日期：{{ transaction.date }}</p>
                <p class="transaction-buyer">买家：{{ transaction.buyer }}</p>
              </div>
              <div class="transaction-details">
                <span class="transaction-price">¥{{ transaction.price }}</span>
                <span class="transaction-status" :class="transaction.status">{{ transaction.status }}</span>
                <button 
                  class="view-detail-btn"
                  @click="viewTransactionDetail(transaction)"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑资料弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑资料</h3>
          <button class="close-btn" @click="showEditModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <form class="edit-form" @submit.prevent="updateProfile">
            <div class="form-group">
              <label for="edit-name">姓名</label>
              <input 
                type="text" 
                id="edit-name" 
                v-model="editForm.name"
                placeholder="输入姓名"
                @input="validateField('name', editForm.name)"
                :class="{ 'error': editFormErrors.name }"
              >
              <div v-if="editFormErrors.name" class="error-message">{{ editFormErrors.name }}</div>
            </div>
            <div class="form-group">
              <label for="edit-university">学校</label>
              <input 
                type="text" 
                id="edit-university" 
                v-model="editForm.university"
                placeholder="输入学校名称"
                @input="validateField('university', editForm.university)"
                :class="{ 'error': editFormErrors.university }"
              >
              <div v-if="editFormErrors.university" class="error-message">{{ editFormErrors.university }}</div>
            </div>
            <div class="form-group">
              <label for="edit-bio">个人简介</label>
              <textarea 
                id="edit-bio" 
                rows="3" 
                v-model="editForm.bio"
                placeholder="简单介绍一下自己..."
                maxlength="200"
                @input="validateField('bio', editForm.bio)"
                :class="{ 'error': editFormErrors.bio }"
              ></textarea>
              <div class="char-count">{{ editForm.bio.length }}/200</div>
              <div v-if="editFormErrors.bio" class="error-message">{{ editFormErrors.bio }}</div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="showEditModal = false">取消</button>
              <button type="submit" class="btn btn-primary">保存更改</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- 评价弹窗 -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>评价卖家</h3>
          <button class="close-btn" @click="showReviewModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="review-form">
            <h4>评价：{{ selectedTransaction?.seller }}</h4>
            <p>物品：{{ selectedTransaction?.item }}</p>
            
            <div class="form-group">
              <label>评分</label>
              <div class="rating-selector">
                <span 
                  v-for="i in 5" 
                  :key="i" 
                  class="star" 
                  :class="{ 'selected': reviewForm.rating >= i }"
                  @click="reviewForm.rating = i; validateReviewForm()"
                >
                  ★
                </span>
              </div>
              <div v-if="reviewFormErrors.rating" class="error-message">{{ reviewFormErrors.rating }}</div>
            </div>
            
            <div class="form-group">
              <label for="review-content">评价内容</label>
              <textarea 
                id="review-content" 
                rows="4" 
                v-model="reviewForm.content"
                placeholder="请分享您的交易体验..."
                @input="validateReviewForm()"
                :class="{ 'error': reviewFormErrors.content }"
              ></textarea>
              <div class="char-count">{{ reviewForm.content.length }}/500</div>
              <div v-if="reviewFormErrors.content" class="error-message">{{ reviewFormErrors.content }}</div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="showReviewModal = false">取消</button>
              <button type="button" class="btn btn-primary" @click="submitReview">提交评价</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 交易详情弹窗 -->
    <div v-if="showTransactionDetailModal" class="modal-overlay" @click.self="showTransactionDetailModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>交易详情</h3>
          <button class="close-btn" @click="showTransactionDetailModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="transaction-detail">
            <div class="detail-item">
              <span class="detail-label">物品名称：</span>
              <span class="detail-value">{{ selectedTransaction?.item }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">交易金额：</span>
              <span class="detail-value price">¥{{ selectedTransaction?.price }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">交易日期：</span>
              <span class="detail-value">{{ selectedTransaction?.date }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ selectedTransaction?.seller ? '卖家名称：' : '买家名称：' }}</span>
              <span class="detail-value">{{ selectedTransaction?.seller || selectedTransaction?.buyer }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">交易状态：</span>
              <span class="detail-value">
                <span class="transaction-status" :class="selectedTransaction?.status">{{ selectedTransaction?.status }}</span>
              </span>
            </div>
            <div class="detail-item" v-if="selectedTransaction?.paymentMethod">
              <span class="detail-label">支付方式：</span>
              <span class="detail-value">{{ selectedTransaction?.paymentMethod }}</span>
            </div>
            <div class="detail-item" v-if="selectedTransaction?.deliveryAddress">
              <span class="detail-label">收货地址：</span>
              <span class="detail-value">{{ selectedTransaction?.deliveryAddress }}</span>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-primary" @click="showTransactionDetailModal = false">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api/index.js';

export default {
  name: 'ProfileView',
  data() {
    return {
      activeTab: 'items',
      showEditModal: false,
      showReviewModal: false,
      showTransactionDetailModal: false,
      selectedTransaction: null,
      avatarUploading: false,
      loading: true,
      
      // 用户信息
      user: {
        id: null,
        name: '',
        email: '',
        university: '',
        profileImage: 'https://via.placeholder.com/150',
        bio: '',
        rating: 0,
        reviewCount: 0
      },
      
      // 编辑资料表单
      editForm: {
        name: '',
        university: '',
        bio: ''
      },
      // 编辑资料表单验证错误
      editFormErrors: {
        name: '',
        university: '',
        bio: ''
      },
      
      // 评价表单
      reviewForm: {
        rating: 0,
        content: ''
      },
      // 评价表单验证错误
      reviewFormErrors: {
        rating: '',
        content: ''
      },
      
      // 我的物品
      userItems: [],
      
      // 我的购买
      purchases: [],
      
      // 我的销售
      sales: [],
      
      // 我的评价
      reviews: []
    }
  },
  computed: {
    universityId() {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.universityId || 1;
    },
    userId() {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.id || null;
    }
  },
  methods: {
    // 加载用户数据
    async loadUserData() {
      try {
        if (!this.userId) {
          this.$router.push('/login');
          return;
        }
        
        const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

        const userResponse = await api.user.getProfile(this.userId);
        const profile = userResponse.data || {};

        this.user = {
          id: profile.id,
          username: profile.username,
          realName: profile.realName,
          email: profile.email,
          studentId: profile.studentId,
          profileImage: profile.avatarUrl || profile.profileImage || storedUserInfo.profileImage || this.user.profileImage,
          bio: storedUserInfo.bio || this.user.bio,
          rating: profile.rating || 0,
          reviewCount: profile.reviewCount || 0
        };
        
        const mergedUserInfo = { ...storedUserInfo, ...this.user, avatarUrl: profile.avatarUrl || storedUserInfo.avatarUrl };
        localStorage.setItem('userInfo', JSON.stringify(mergedUserInfo));
        
        const itemsResponse = await api.item.getBySeller(this.userId, 0, 20);
        const itemsPage = itemsResponse.data;
        this.userItems = itemsPage.content || itemsPage || [];
        
        const purchasesResponse = await api.transaction.getByBuyer(this.userId, 0, 20);
        const purchasesPage = purchasesResponse.data;
        const rawPurchases = purchasesPage.content || purchasesPage || [];
        this.purchases = rawPurchases.map(tx => {
          const itemTitle = tx.item && tx.item.title ? tx.item.title : '未知物品';
          const sellerName = tx.seller && (tx.seller.realName || tx.seller.username) ? (tx.seller.realName || tx.seller.username) : '未知卖家';
          return {
            id: tx.id,
            item: itemTitle,
            date: this.formatDate(tx.createdAt),
            seller: sellerName,
            price: tx.price,
            status: this.mapTransactionStatus(tx.status),
            paymentStatus: tx.paymentStatus,
            paymentMethod: tx.paymentGateway,
            deliveryAddress: tx.meetingLocation,
            raw: tx,
            reviewed: false
          };
        });
        
        const salesResponse = await api.transaction.getBySeller(this.userId, 0, 20);
        const salesPage = salesResponse.data;
        const rawSales = salesPage.content || salesPage || [];
        this.sales = rawSales.map(tx => {
          const itemTitle = tx.item && tx.item.title ? tx.item.title : '未知物品';
          const buyerName = tx.buyer && (tx.buyer.realName || tx.buyer.username) ? (tx.buyer.realName || tx.buyer.username) : '未知买家';
          return {
            id: tx.id,
            item: itemTitle,
            date: this.formatDate(tx.createdAt),
            buyer: buyerName,
            price: tx.price,
            status: this.mapTransactionStatus(tx.status),
            paymentStatus: tx.paymentStatus,
            paymentMethod: tx.paymentGateway,
            deliveryAddress: tx.meetingLocation,
            raw: tx
          };
        });
        
        const reviewsResponse = await api.review.getByUser(this.userId, 0, 20);
        const reviewsPage = reviewsResponse.data;
        this.reviews = reviewsPage.content || reviewsPage || [];
        
        this.editForm.name = this.user.realName || this.user.username || '';
        this.editForm.university = this.user.studentId || '';
        this.editForm.bio = this.user.bio || '';
        
        this.loading = false;
      } catch (error) {
        console.error('加载用户数据失败:', error);
        this.loading = false;
      }
    },

    mapTransactionStatus(status) {
      if (!status) return '未知状态';
      const key = typeof status === 'string' ? status.toUpperCase() : status;
      const statusMap = {
        PENDING: '待完成',
        COMPLETED: '已完成',
        CANCELLED: '已取消'
      };
      return statusMap[key] || status;
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
    
    // 打开头像上传（真正选择图片）
    openAvatarUpload() {
      if (!this.userId) {
        this.$router.push('/login');
        return;
      }
      if (this.$refs.avatarInput) {
        this.$refs.avatarInput.click();
      }
    },

    // 处理头像图片上传
    async handleAvatarUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }

      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('只支持JPG和PNG格式的图片');
        event.target.value = '';
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('头像大小不能超过2MB');
        event.target.value = '';
        return;
      }

      this.avatarUploading = true;
      try {
        const response = await api.user.uploadAvatar(this.userId, file);
        const data = response.data || {};
        const newAvatar = data.avatarUrl || this.user.profileImage;

        this.user.profileImage = newAvatar;
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const merged = { ...userInfo, profileImage: newAvatar, avatarUrl: newAvatar };
        localStorage.setItem('userInfo', JSON.stringify(merged));
        alert('头像已更新');
      } catch (error) {
        console.error('上传头像失败:', error);
        alert('上传头像失败，请稍后重试');
      } finally {
        this.avatarUploading = false;
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    
    // 编辑物品
    editItem(item) {
      // 跳转到编辑页面
      this.$router.push({
        path: '/sell',
        query: { edit: item.id }
      });
    },
    
    // 删除物品
    async deleteItem(itemId) {
      if (!confirm('您确定要删除这个物品吗？')) {
        return;
      }
      try {
        await api.item.delete(itemId);
        this.userItems = this.userItems.filter(item => item.id !== itemId);
        alert('物品已删除');
      } catch (error) {
        console.error('删除物品失败:', error);
        alert('删除失败，请稍后重试');
      }
    },
    
    // 更新资料
    async updateProfile() {
      if (!this.validateEditForm()) {
        return;
      }

      if (!this.userId) {
        this.$router.push('/login');
        return;
      }

      try {
        const payload = {
          realName: this.editForm.name,
          studentId: this.editForm.university,
          avatarUrl: this.user.profileImage
        };

        const response = await api.user.updateProfile(this.userId, payload);
        const updated = response.data || {};

        this.user.realName = updated.realName || this.editForm.name;
        this.user.studentId = updated.studentId || this.editForm.university;
        this.user.bio = this.editForm.bio;

        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const merged = { ...userInfo, ...this.user };
        localStorage.setItem('userInfo', JSON.stringify(merged));

        this.showEditModal = false;
        alert('资料已更新');
      } catch (error) {
        console.error('更新资料失败:', error);
        alert('更新资料失败，请稍后重试');
      }
    },
    
    // 查看交易详情
    viewTransactionDetail(transaction) {
      this.selectedTransaction = transaction;
      this.showTransactionDetailModal = true;
    },
    
    // 验证编辑资料表单字段
    validateField(field, value) {
      switch (field) {
        case 'name':
          if (!value.trim()) {
            this.editFormErrors.name = '姓名不能为空';
          } else if (value.trim().length < 2 || value.trim().length > 20) {
            this.editFormErrors.name = '姓名长度必须在2-20个字符之间';
          } else {
            this.editFormErrors.name = '';
          }
          break;
        case 'university':
          if (!value.trim()) {
            this.editFormErrors.university = '学校不能为空';
          } else if (value.trim().length < 2 || value.trim().length > 50) {
            this.editFormErrors.university = '学校名称长度必须在2-50个字符之间';
          } else {
            this.editFormErrors.university = '';
          }
          break;
        case 'bio':
          if (value.length > 200) {
            this.editFormErrors.bio = '个人简介不能超过200个字符';
          } else {
            this.editFormErrors.bio = '';
          }
          break;
      }
    },
    
    // 验证整个编辑资料表单
    validateEditForm() {
      let isValid = true;
      
      // 验证姓名
      this.validateField('name', this.editForm.name);
      if (this.editFormErrors.name) isValid = false;
      
      // 验证学校
      this.validateField('university', this.editForm.university);
      if (this.editFormErrors.university) isValid = false;
      
      // 验证个人简介
      this.validateField('bio', this.editForm.bio);
      if (this.editFormErrors.bio) isValid = false;
      
      return isValid;
    },
    
    // 验证评价表单
    validateReviewForm() {
      let isValid = true;
      
      // 验证评分
      if (this.reviewForm.rating === 0) {
        this.reviewFormErrors.rating = '请选择评分';
        isValid = false;
      } else {
        this.reviewFormErrors.rating = '';
      }
      
      // 验证评价内容
      if (!this.reviewForm.content.trim()) {
        this.reviewFormErrors.content = '请输入评价内容';
        isValid = false;
      } else if (this.reviewForm.content.length < 10) {
        this.reviewFormErrors.content = '评价内容至少10个字符';
        isValid = false;
      } else if (this.reviewForm.content.length > 500) {
        this.reviewFormErrors.content = '评价内容不能超过500个字符';
        isValid = false;
      } else {
        this.reviewFormErrors.content = '';
      }
      
      return isValid;
    },
    submitReview() {
      if (!this.validateReviewForm()) {
        return;
      }
      
      // 模拟提交评价
      console.log('提交评价:', this.reviewForm);
      
      // 更新交易状态
      const transaction = this.purchases.find(t => t.id === this.selectedTransaction.id);
      if (transaction) {
        transaction.reviewed = true;
      }
      
      // 关闭弹窗
      this.showReviewModal = false;
      this.reviewForm = { rating: 0, content: '' };
      this.reviewFormErrors = { rating: '', content: '' };
      alert('评价已提交，感谢您的反馈！');
    }
  },
  mounted() {
    this.loadUserData();
  }
}
</script>

<style scoped>
/* 整体容器 */
.profile-container {
  padding: 2rem 0;
}

.profile-container h2 {
  color: #4a6fa5;
  margin-bottom: 2rem;
  text-align: center;
}

/* 主要内容 */
.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 用户信息部分 */
.profile-info {
  display: flex;
  align-items: center;
  padding: 2rem;
  background-color: #f9f9f9;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem 1rem;
  }
  
  .profile-avatar {
    margin-right: 0;
    margin-bottom: 1.5rem;
  }
  
  .profile-details {
    width: 100%;
    max-width: none;
  }
  
  .profile-bio {
    max-width: none;
  }
}

/* 头像部分 */
.profile-avatar {
  margin-right: 2rem;
  position: relative;
  cursor: pointer;
}

.profile-avatar img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #4a6fa5;
  transition: transform 0.3s;
}

.profile-avatar:hover img {
  transform: scale(1.05);
}

.avatar-edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.profile-avatar:hover .avatar-edit-overlay {
  opacity: 1;
}

.avatar-edit-overlay svg {
  color: white;
  width: 32px;
  height: 32px;
}

/* 头像上传中状态 */
.avatar-uploading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.uploading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 用户详情 */
.profile-details {
  flex: 1;
}

.profile-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  color: #333;
}

.profile-email, .profile-university {
  margin: 0.25rem 0;
  color: #666;
}

.profile-bio {
  margin: 1rem 0;
  color: #555;
  line-height: 1.5;
  max-width: 600px;
}

.profile-bio p {
  margin: 0;
}

/* 评分部分 */
.profile-rating {
  display: flex;
  align-items: center;
  margin-top: 1rem;
}

.rating {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4a6fa5;
  margin-right: 0.5rem;
}

.stars {
  color: #ffd700;
  margin-right: 0.5rem;
}

.stars span {
  transition: color 0.3s;
}

.stars .filled {
  color: #ffd700;
}

.review-count {
  color: #999;
  font-size: 0.9rem;
}

/* 编辑按钮 */
.edit-profile-btn {
  padding: 0.8rem 1.5rem;
  background-color: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s, transform 0.2s;
}

/* 表单验证样式 */
input.error, textarea.error {
  border: 1px solid #e74c3c;
  background-color: #fdf2f2;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

/* 交易详情样式 */
.transaction-detail {
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  margin-bottom: 1rem;
  align-items: center;
}

.detail-label {
  font-weight: bold;
  color: #333;
  width: 100px;
}

.detail-value {
  color: #555;
  flex: 1;
}

.detail-value.price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #e74c3c;
}

/* 响应式设计 - 继续 */
@media (max-width: 768px) {
  /* 标签页 */
  .profile-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .tab-btn {
    margin-bottom: 0.5rem;
    margin-right: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  /* 物品网格 */
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .item-card {
    padding: 0.75rem;
  }
  
  .item-title {
    font-size: 0.9rem;
  }
  
  .item-price {
    font-size: 1rem;
  }
  
  /* 交易列表 */
  .transactions-list {
    padding: 0 1rem;
  }
  
  .transaction-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .transaction-info {
    margin-bottom: 1rem;
    width: 100%;
  }
  
  .transaction-details {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  /* 评价列表 */
  .reviews-list {
    padding: 0 1rem;
  }
  
  /* 模态框 */
  .modal-content {
    margin: 1rem;
    max-width: calc(100% - 2rem);
  }
  
  /* 表单样式 */
  .form-group {
    margin-bottom: 1rem;
    gap: 0.75rem;
  }
  
  input, textarea {
    font-size: 1rem;
    padding: 1rem;
    min-height: 48px;
  }
  
  textarea {
    min-height: 120px;
  }
  
  /* 按钮样式 */
  .btn {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
  }
  
  /* 表单组间距优化 */
  .form-actions {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  /* 物品网格 */
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  
  .item-image {
    height: 140px;
  }
  
  .item-info {
    padding: 0.75rem;
  }
  
  .item-title {
    font-size: 0.9rem;
  }
  
  .item-price {
    font-size: 1rem;
  }
  
  .item-actions {
    padding: 0 0.75rem 0.75rem;
  }
  
  .edit-item-btn, .delete-item-btn {
    padding: 0.4rem;
    font-size: 0.8rem;
  }
  
  /* 交易详情 */
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .detail-label {
    width: auto;
    margin-bottom: 0.25rem;
  }
  
  /* 表单样式 */
  input, textarea {
    padding: 0.9rem;
    font-size: 0.95rem;
  }
  
  textarea {
    min-height: 100px;
  }
  
  /* 按钮样式 */
  .btn {
    padding: 0.9rem;
    font-size: 0.95rem;
  }
}

.edit-profile-btn:hover {
  background-color: #3a5a85;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 标签页 */
.profile-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: 1rem 2rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  color: #666;
  transition: all 0.3s;
  position: relative;
}

.tab-btn:hover {
  color: #4a6fa5;
  background-color: rgba(74, 111, 165, 0.05);
}

.tab-btn.active {
  color: #4a6fa5;
  border-bottom: 3px solid #4a6fa5;
  background-color: rgba(74, 111, 165, 0.05);
}

/* 标签页内容 */
.profile-tab-content {
  padding: 2rem;
}

/* 物品列表 */
.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.items-header h3 {
  margin: 0;
  color: #333;
}

.add-item-btn {
  padding: 0.75rem 1.5rem;
  background-color: #4a6fa5;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.3s, transform 0.2s;
}

.add-item-btn:hover {
  background-color: #3a5a85;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.item-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s, transform 0.2s;
}

.item-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.item-link:hover .item-image img {
  transform: scale(1.1);
}

.item-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.item-image {
  height: 180px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}



.item-info {
  padding: 1rem;
}

.item-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: #4a6fa5;
}

.item-status {
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-badge.在售 {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.已售出 {
  background-color: #f8d7da;
  color: #721c24;
}

.item-actions {
  display: flex;
  padding: 0 1rem 1rem;
  gap: 0.5rem;
}

.edit-item-btn, .delete-item-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.edit-item-btn {
  background-color: #4a6fa5;
  color: white;
}

.edit-item-btn:hover {
  background-color: #3a5a85;
}

.delete-item-btn {
  background-color: #dc3545;
  color: white;
}

.delete-item-btn:hover {
  background-color: #c82333;
}

/* 交易列表 */
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: box-shadow 0.3s, transform 0.2s;
}

.transaction-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.transaction-info h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
  word-break: break-word;
}

.transaction-date, .transaction-seller, .transaction-buyer {
  margin: 0.25rem 0;
  color: #666;
  font-size: 0.9rem;
  word-break: break-word;
}

.transaction-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 120px;
}

.transaction-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4a6fa5;
}

/* 响应式交易列表 */
@media (max-width: 768px) {
  .transaction-item {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .transaction-details {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .transaction-status {
    order: -1;
    width: fit-content;
    margin-bottom: 0.5rem;
  }
  
  .view-detail-btn, .review-btn {
    padding: 0.4rem 0.7rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .transaction-item {
    padding: 0.8rem;
  }
  
  .transaction-info h4 {
    font-size: 1rem;
  }
  
  .transaction-date, .transaction-seller, .transaction-buyer {
    font-size: 0.8rem;
  }
  
  .transaction-price {
    font-size: 1.1rem;
  }
  
  .transaction-details {
    gap: 0.4rem;
  }
  
  .transaction-status {
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
  }
}

.transaction-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.transaction-status.已完成 {
  background-color: #d4edda;
  color: #155724;
}

.transaction-status.待付款 {
  background-color: #fff3cd;
  color: #856404;
}

.transaction-status.待发货 {
  background-color: #cce7ff;
  color: #004085;
}

.transaction-status.待收货 {
  background-color: #d1ecf1;
  color: #0c5460;
}

.review-btn {
  padding: 0.3rem 0.8rem;
  background-color: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.review-btn:hover {
  background-color: #3a5a85;
}

/* 评价列表 */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-item {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: box-shadow 0.3s;
}

.review-item:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.reviewer-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
}

.reviewer-name {
  margin: 0 0 0.25rem 0;
  font-weight: bold;
  color: #333;
}

.review-date {
  margin: 0;
  font-size: 0.8rem;
  color: #999;
}

.review-rating {
  margin-top: 0.5rem;
}

.review-content {
  margin: 0 0 1rem 0;
  color: #333;
  line-height: 1.6;
}

.review-item-info {
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.item-name {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #f8f9fa;
  color: #6c757d;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* 弹窗样式 */
.modal-overlay {
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
  padding: 1rem;
  animation: fadeIn 0.3s ease;
  overflow-y: auto;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
  margin: 2rem 0;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: #f8f9fa;
}

.modal-body {
  padding: 1rem 1.5rem 1.5rem;
}

/* 响应式弹窗样式 */
@media (max-width: 768px) {
  .modal-content {
    margin: 1rem 0;
    max-height: calc(100vh - 2rem);
  }
  
  .modal-header {
    padding: 1.25rem 1.25rem 0.75rem;
  }
  
  .modal-body {
    padding: 0.75rem 1.25rem 1.25rem;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    margin: 0.5rem 0;
    max-height: calc(100vh - 1rem);
  }
  
  .modal-header {
    padding: 1rem 1rem 0.5rem;
  }
  
  .modal-header h3 {
    font-size: 1.25rem;
  }
  
  .modal-body {
    padding: 0.5rem 1rem 1rem;
  }
  
  /* 优化小屏幕上的表单 */
  .edit-form, .review-form {
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

/* 表单样式 */
.edit-form, .review-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  color: #333;
}

.form-group input, .form-group textarea {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  min-height: 44px;
  box-sizing: border-box;
}

/* 响应式表单样式 */
@media (max-width: 768px) {
  .edit-form, .review-form {
    gap: 1.25rem;
  }
  
  .form-group {
    gap: 0.75rem;
  }
  
  .form-group label {
    font-size: 1rem;
  }
  
  .form-group input, .form-group textarea {
    padding: 1rem;
    font-size: 1rem;
    min-height: 48px;
  }
  
  .form-group textarea {
    min-height: 120px;
  }
  
  .char-count {
    font-size: 0.85rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn {
    width: 100%;
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .form-group input, .form-group textarea {
    padding: 0.9rem;
    font-size: 0.95rem;
  }
  
  .form-group textarea {
    min-height: 100px;
  }
  
  .btn {
    padding: 0.9rem;
    font-size: 0.95rem;
  }
}

.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  font-size: 0.8rem;
  color: #999;
  text-align: right;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* 评分选择器 */
.rating-selector {
  display: flex;
  gap: 0.5rem;
}

.rating-selector .star {
  font-size: 1.8rem;
  color: #ddd;
  cursor: pointer;
  transition: color 0.3s;
}

.rating-selector .star:hover, .rating-selector .star.selected {
  color: #ffd700;
}

/* 按钮样式 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.btn-primary {
  background-color: #4a6fa5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3a5a85;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 1rem 0;
  }
  
  .profile-info {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }
  
  .profile-avatar {
    margin-right: 0;
    margin-bottom: 1.5rem;
  }
  
  .profile-rating {
    justify-content: center;
  }
  
  .edit-profile-btn {
    margin-top: 1rem;
  }
  
  .profile-tabs {
    overflow-x: auto;
  }
  
  .tab-btn {
    padding: 1rem;
    white-space: nowrap;
  }
  
  .profile-tab-content {
    padding: 1.5rem;
  }
  
  .items-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .add-item-btn {
    text-align: center;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .transaction-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .transaction-details {
    align-items: stretch;
  }
  
  .review-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .review-rating {
    align-self: flex-start;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .modal-content {
    margin: 1rem;
  }
}
</style>
