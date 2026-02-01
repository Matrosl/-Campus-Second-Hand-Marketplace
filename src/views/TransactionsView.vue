<template>
  <div class="transactions-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>交易记录</h1>
      <div class="transaction-stats">
        <div class="stat-item">
          <div class="stat-number">24</div>
          <div class="stat-label">进行中</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">156</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">8</div>
          <div class="stat-label">已取消</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">188</div>
          <div class="stat-label">总计</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label for="status-filter">交易状态：</label>
        <select id="status-filter" v-model="selectedStatus">
          <option value="">全部</option>
          <option value="pending">待处理</option>
          <option value="processing">进行中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="type-filter">交易类型：</label>
        <select id="type-filter" v-model="selectedType">
          <option value="">全部</option>
          <option value="buy">我购买的</option>
          <option value="sell">我出售的</option>
        </select>
      </div>
      <div class="search-box">
        <input type="text" v-model="searchQuery" placeholder="搜索物品名称...">
      </div>
    </div>

    <!-- 交易记录列表 -->
    <div class="transactions-list">
      <div 
        v-for="transaction in filteredTransactions" 
        :key="transaction.id"
        class="transaction-item"
        @click="viewTransactionDetail(transaction.id)"
      >
        <!-- 物品信息 -->
        <div class="transaction-info">
          <div class="item-image">
            <img :src="transaction.item.image" :alt="transaction.item.name">
          </div>
          <div class="item-details">
            <div class="item-name">{{ transaction.item.name }}</div>
            <div class="transaction-date">{{ formatDate(transaction.createdAt) }}</div>
            <div class="transaction-partner">
              <span v-if="transaction.type === 'buy'">卖家：</span>
              <span v-else>买家：</span>
              {{ transaction.partner.name }}
            </div>
          </div>
        </div>

        <!-- 交易状态 -->
        <div class="transaction-status">
          <div :class="['status-badge', transaction.status]">
            {{ getStatusText(transaction.status) }}
          </div>
        </div>

        <!-- 交易金额 -->
        <div class="transaction-amount">
          ¥{{ transaction.amount.toFixed(2) }}
        </div>

        <!-- 操作按钮 -->
        <div class="transaction-actions">
          <button 
            v-if="transaction.status === 'pending'" 
            class="btn btn-primary"
            @click.stop="confirmTransaction(transaction.id)"
          >
            确认
          </button>
          <button 
            v-if="transaction.status === 'pending'" 
            class="btn btn-secondary"
            @click.stop="cancelTransaction(transaction.id)"
          >
            取消
          </button>
          <button 
            v-if="transaction.status === 'processing'" 
            class="btn btn-primary"
            @click.stop="completeTransaction(transaction.id)"
          >
            完成
          </button>
          <button 
            v-if="transaction.status === 'completed' && !transaction.reviewed" 
            class="btn btn-primary"
            @click.stop="writeReview(transaction.id)"
          >
            评价
          </button>
        </div>
      </div>
    </div>

    <!-- 无交易记录提示 -->
    <div v-if="filteredTransactions.length === 0" class="no-transactions">
      <div class="empty-icon">📦</div>
      <p>暂无交易记录</p>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="filteredTransactions.length > 0">
      <button class="page-btn" @click="currentPage = 1" :disabled="currentPage === 1">
        首页
      </button>
      <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1">
        上一页
      </button>
      <span class="page-info">
        第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
      </span>
      <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages">
        下一页
      </button>
      <button class="page-btn" @click="currentPage = totalPages" :disabled="currentPage === totalPages">
        末页
      </button>
    </div>
  </div>
</template>

<script>
import api from '../api/index.js';

export default {
  name: 'TransactionsView',
  data() {
    return {
      // 交易记录数据
      transactions: [],
      // 筛选条件
      selectedStatus: '',
      selectedType: '',
      searchQuery: '',
      // 分页
      currentPage: 1,
      itemsPerPage: 10,
      // 加载和错误状态
      loading: true,
      error: null,
      // 统计数据
      stats: {
        pending: 0,
        processing: 0,
        completed: 0,
        total: 0
      }
    }
  },
  mounted() {
    this.fetchTransactions();
  },
  computed: {
    // 筛选后的交易记录
    filteredTransactions() {
      return this.transactions.filter(transaction => {
        // 状态筛选
        const statusMatch = this.selectedStatus ? transaction.status === this.selectedStatus : true;
        // 类型筛选
        const typeMatch = this.selectedType ? transaction.type === this.selectedType : true;
        // 搜索筛选
        const searchMatch = this.searchQuery ? 
          transaction.item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) : 
          true;
        
        return statusMatch && typeMatch && searchMatch;
      });
    },
    // 总页数
    totalPages() {
      return Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    },
    // 获取大学ID
    universityId() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.universityId || 1;
    },
    // 获取用户ID
    userId() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || null;
    }
  },
  methods: {
    // 获取交易记录
    async fetchTransactions() {
      if (!this.userId) {
        this.loading = false;
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        // 同时获取买家和卖家的交易记录
        const [buyerResponse, sellerResponse] = await Promise.all([
          api.transaction.getByBuyer(this.userId, this.universityId),
          api.transaction.getBySeller(this.userId, this.universityId)
        ]);
        
        // 合并并处理交易记录
        const allTransactions = [...buyerResponse.data, ...sellerResponse.data]
          .map(transaction => ({
            ...transaction,
            // 确定交易类型（买或卖）
            type: transaction.buyerId === this.userId ? 'buy' : 'sell',
            // 确定交易对方
            partner: transaction.buyerId === this.userId ? transaction.seller : transaction.buyer
          }));
        
        // 按创建时间排序
        this.transactions = allTransactions.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // 更新统计数据
        this.updateStats();
      } catch (error) {
        console.error('获取交易记录失败:', error);
        this.error = '获取交易记录失败，请稍后重试';
      } finally {
        this.loading = false;
      }
    },
    
    // 更新统计数据
    updateStats() {
      this.stats.pending = this.transactions.filter(t => t.status === 'pending').length;
      this.stats.processing = this.transactions.filter(t => t.status === 'processing').length;
      this.stats.completed = this.transactions.filter(t => t.status === 'completed').length;
      this.stats.total = this.transactions.length;
    },
    
    // 查看交易详情
    viewTransactionDetail(transactionId) {
      // 实际项目中应该跳转到交易详情页面
      console.log('查看交易详情:', transactionId);
      alert(`查看交易详情：${transactionId}`);
    },
    
    // 确认交易
    async confirmTransaction(transactionId) {
      try {
        await api.transaction.updateStatus(transactionId, 'processing', this.universityId);
        // 更新本地数据
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction) {
          transaction.status = 'processing';
        }
        this.updateStats();
        alert('交易已确认，正在处理中');
      } catch (error) {
        console.error('确认交易失败:', error);
        alert('确认交易失败，请稍后重试');
      }
    },
    
    // 取消交易
    async cancelTransaction(transactionId) {
      try {
        await api.transaction.updateStatus(transactionId, 'cancelled', this.universityId);
        // 更新本地数据
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction) {
          transaction.status = 'cancelled';
        }
        this.updateStats();
        alert('交易已取消');
      } catch (error) {
        console.error('取消交易失败:', error);
        alert('取消交易失败，请稍后重试');
      }
    },
    
    // 完成交易
    async completeTransaction(transactionId) {
      try {
        await api.transaction.updateStatus(transactionId, 'completed', this.universityId);
        // 更新本地数据
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction) {
          transaction.status = 'completed';
        }
        this.updateStats();
        alert('交易已完成');
      } catch (error) {
        console.error('完成交易失败:', error);
        alert('完成交易失败，请稍后重试');
      }
    },
    
    // 撰写评价
    writeReview(transactionId) {
      // 实际项目中应该跳转到评价页面或打开评价模态框
      console.log('撰写评价:', transactionId);
      alert(`撰写评价：${transactionId}`);
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'pending': '待处理',
        'processing': '进行中',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    },
    
    // 应用筛选
    applyFilters() {
      this.currentPage = 1;
    }
  }
}
</script>

<style scoped>
/* 整体容器 */
.transactions-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 页面标题 */
.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
}

/* 统计数据 */
.transaction-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #4a6fa5;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  color: #333;
  font-weight: bold;
}

.filter-group select {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
}

.search-box input {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  width: 200px;
}

/* 交易记录列表 */
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr auto;
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.transaction-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* 交易信息 */
.transaction-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.item-name {
  color: #333;
  font-weight: bold;
  font-size: 1rem;
}

.transaction-date {
  color: #999;
  font-size: 0.8rem;
}

.transaction-partner {
  color: #666;
  font-size: 0.9rem;
}

/* 交易状态 */
.transaction-status {
  display: flex;
  justify-content: center;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  text-align: center;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.processing {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-badge.completed {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

/* 交易金额 */
.transaction-amount {
  color: #4a6fa5;
  font-weight: bold;
  font-size: 1.2rem;
  text-align: right;
}

/* 操作按钮 */
.transaction-actions {
  display: flex;
  gap: 0.5rem;
}

/* 无交易记录提示 */
.no-transactions {
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-transactions p {
  color: #999;
  font-size: 1.1rem;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .transaction-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .transaction-item {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .transaction-status,
  .transaction-amount {
    justify-content: flex-start;
    text-align: left;
  }
  
  .transaction-actions {
    justify-content: flex-start;
  }
}
</style>