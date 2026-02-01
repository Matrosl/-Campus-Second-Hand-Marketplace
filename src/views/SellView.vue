<template>
  <div class="sell-container">
    <h2>{{ isEdit ? '修改物品' : '发布物品' }}</h2>
    
    <form class="sell-form" @submit.prevent="submitForm">
      <div class="form-group">
        <label for="title">物品标题</label>
        <input 
          type="text" 
          id="title" 
          v-model="formData.title"
          placeholder="输入物品标题（10-50个字符）" 
          required
          @input="clearError('title')"
        >
        <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
      </div>
      
      <div class="form-group">
        <label for="description">描述</label>
        <textarea 
          id="description" 
          rows="5" 
          v-model="formData.description"
          placeholder="详细描述您的物品，包括品牌、型号、使用情况等..." 
          required
          @input="clearError('description')"
        ></textarea>
        <span v-if="errors.description" class="error-message">{{ errors.description }}</span>
        <div class="char-count" :class="{ 'char-limit': formData.description.length > 500 }">
          {{ formData.description.length }}/500 字符
        </div>
      </div>
      
      <div class="form-group">
        <label for="price">价格</label>
        <div class="price-input-wrapper">
          <span class="price-symbol">¥</span>
          <input 
            type="number" 
            id="price" 
            v-model.number="formData.price"
            placeholder="输入价格" 
            step="0.01" 
            min="0" 
            required
            @input="clearError('price')"
          >
        </div>
        <span v-if="errors.price" class="error-message">{{ errors.price }}</span>
      </div>
      
      <div class="form-group">
        <label for="category">分类</label>
        <select 
          id="category" 
          v-model="formData.category"
          required
          @change="clearError('category')"
        >
          <option value="">选择分类</option>
          <option 
            v-for="category in categories" 
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        <span v-if="errors.category" class="error-message">{{ errors.category }}</span>
      </div>
      
      <div class="form-group">
        <label for="condition">新旧程度</label>
        <select 
          id="condition" 
          v-model="formData.condition"
          required
        >
          <option value="new">全新</option>
          <option value="like_new">九成新</option>
          <option value="good">八成新</option>
          <option value="Acceptable">七成新</option>
          <option value="poor">六成新以下</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="location">交易地点</label>
        <select 
          id="location" 
          v-model="formData.location"
          required
          @change="clearError('location')"
        >
          <option value="">选择交易地点</option>
          <option 
            v-for="location in locations" 
            :key="location"
            :value="location"
          >
            {{ location }}
          </option>
        </select>
        <span v-if="errors.location" class="error-message">{{ errors.location }}</span>
      </div>
      
      <div class="form-group">
        <label for="images">物品图片 <span class="required">*</span></label>
        <div class="image-upload-area">
          <input 
            type="file" 
            id="images" 
            multiple 
            accept="image/*"
            @change="handleImageUpload"
            ref="fileInput"
          >
          <div class="upload-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4a6fa5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
            <p>点击或拖拽图片到此处上传</p>
            <p class="help-text">支持JPG、PNG格式，最多上传5张图片</p>
          </div>
        </div>
        <span v-if="errors.images" class="error-message">{{ errors.images }}</span>
        
        <!-- 图片预览 -->
        <div v-if="formData.images.length > 0" class="image-preview-container">
          <div class="image-preview" v-for="(image, index) in formData.images" :key="index">
            <img :src="image.url" :alt="`Preview ${index + 1}`">
            <button 
              type="button" 
              class="remove-image" 
              @click="removeImage(index)"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
      
      <span v-if="errors.general" class="error-message general-error">{{ errors.general }}</span>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting" class="loading">{{ isEdit ? '保存中...' : '发布中...' }}</span>
          <span v-else>{{ isEdit ? '保存修改' : '发布物品' }}</span>
        </button>
        <button type="button" class="btn btn-secondary" @click="cancel" :disabled="submitting">取消</button>
      </div>
    </form>
  </div>
</template>

<script>
import api from '../api/index.js';

export default {
  name: 'SellView',
  data() {
    return {
      formData: {
        title: '',
        description: '',
        price: '',
        category: '',
        condition: 'new',
        location: '',
        images: []
      },
      errors: {},
      submitting: false,
      universityId: null,
      userId: null,
      categories: [],
      analyzingImage: false,
      isEdit: false,
      editItemId: null,
      locations: []
    }
  },
  async mounted() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    this.universityId = userInfo.universityId || 1;
    this.userId = userInfo.id;
    await Promise.all([
      this.loadCategories(),
      this.loadLocations()
    ]);
    const editId = this.$route.query.edit;
    if (editId) {
      this.isEdit = true;
      this.editItemId = Number(editId);
      await this.loadItemForEdit();
    }
  },
  methods: {
    clearError(field) {
      if (this.errors[field]) {
        this.$delete(this.errors, field);
      }
    },
    async loadCategories() {
      try {
        const response = await api.category.getAll();
        this.categories = response.data || [];
      } catch (error) {
        console.error('获取分类列表失败:', error);
        this.categories = [];
      }
    },
    async loadLocations() {
      try {
        const response = await api.item.getLocations();
        this.locations = response.data || [];
      } catch (error) {
        console.error('获取交易地点列表失败:', error);
        this.locations = [];
      }
    },
    async loadItemForEdit() {
      if (!this.editItemId) {
        return;
      }
      try {
        const response = await api.item.getById(this.editItemId);
        const item = response.data || {};
        this.formData.title = item.title || '';
        this.formData.description = item.description || '';
        this.formData.price = item.price || '';
        this.formData.category = item.category && item.category.id ? item.category.id : item.category || '';
        this.formData.condition = item.itemCondition || 'new';
        this.formData.location = item.location || '';
        if (this.formData.location && !this.locations.includes(this.formData.location)) {
          this.locations.push(this.formData.location);
        }
        this.formData.images = Array.isArray(item.images)
          ? item.images.map(image => ({
              file: null,
              url: image.imageUrl
            }))
          : [];
      } catch (error) {
        console.error('加载物品信息失败:', error);
        this.errors.general = '加载物品信息失败，请稍后重试';
      }
    },
    handleImageUpload(event) {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      if (this.formData.images.length + files.length > 5) {
        this.errors.images = '最多只能上传5张图片';
        return;
      }

      const validFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
          this.errors.images = '只支持JPG和PNG格式的图片';
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          this.errors.images = '每张图片大小不能超过5MB';
          return;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        this.analyzeImage(validFiles[0]);
      }

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          this.formData.images.push({
            file: file,
            url: e.target.result
          });
        };
        reader.readAsDataURL(file);
      }

      event.target.value = '';
      this.clearError('images');
    },
    async analyzeImage(file) {
      if (!file || this.analyzingImage) {
        return;
      }

      this.analyzingImage = true;

      try {
        const response = await api.item.analyzeImage(file);
        const data = response.data || {};

        if (!this.formData.category && data.category && data.category.id) {
          this.formData.category = data.category.id;
        }

        if ((!this.formData.description || this.formData.description.trim().length < 10) && data.description) {
          this.formData.description = data.description;
        }
      } catch (error) {
        console.error('图片识别失败:', error);
        if (!this.errors.general) {
          this.errors.general = '图片识别失败，请手动选择分类并填写描述';
        }
      } finally {
        this.analyzingImage = false;
      }
    },
    removeImage(index) {
      this.formData.images.splice(index, 1);
      this.clearError('images');
    },
    validateForm() {
      this.errors = {};
      let isValid = true;
      
      // 验证标题
      if (!this.formData.title.trim()) {
        this.errors.title = '请输入物品标题';
        isValid = false;
      } else if (this.formData.title.trim().length < 10) {
        this.errors.title = '标题至少需要10个字符';
        isValid = false;
      } else if (this.formData.title.trim().length > 50) {
        this.errors.title = '标题不能超过50个字符';
        isValid = false;
      }
      
      // 验证描述
      if (!this.formData.description.trim()) {
        this.errors.description = '请输入物品描述';
        isValid = false;
      } else if (this.formData.description.trim().length < 50) {
        this.errors.description = '描述至少需要50个字符';
        isValid = false;
      } else if (this.formData.description.trim().length > 500) {
        this.errors.description = '描述不能超过500个字符';
        isValid = false;
      }
      
      // 验证价格
      if (this.formData.price === '' || isNaN(this.formData.price)) {
        this.errors.price = '请输入有效的价格';
        isValid = false;
      } else if (this.formData.price <= 0) {
        this.errors.price = '价格必须大于0';
        isValid = false;
      }
      
      // 验证分类
      if (!this.formData.category) {
        this.errors.category = '请选择物品分类';
        isValid = false;
      }
      
      // 验证地点
      if (!this.formData.location) {
        this.errors.location = '请选择交易地点';
        isValid = false;
      }
      
      // 验证图片
      if (this.formData.images.length === 0) {
        this.errors.images = '请至少上传一张物品图片';
        isValid = false;
      }
      
      return isValid;
    },
    submitForm() {
      if (!this.validateForm()) return;
      if (!this.userId) {
        this.errors.general = '用户信息缺失，请先登录并完善个人资料';
        return;
      }
      
      this.submitting = true;
      
      try {
        const itemData = {
          title: this.formData.title,
          description: this.formData.description,
          price: this.formData.price,
          category: {
            id: this.formData.category
          },
          location: this.formData.location,
          itemCondition: this.formData.condition,
          user: {
            id: this.userId
          },
          university: {
            id: this.universityId
          },
          images: this.formData.images.map((image, index) => ({
            imageUrl: image.url,
            isMain: index === 0
          }))
        };
        
        if (this.isEdit && this.editItemId) {
          api.item.update(this.editItemId, itemData).then(response => {
            console.log('物品更新成功:', response.data);
            this.submitting = false;
            this.$router.push({
              path: '/profile',
              query: { success: '修改成功！' }
            });
          }).catch(error => {
            console.error('物品更新失败:', error);
            this.errors.general = error.response?.data?.message || '修改失败，请稍后重试';
            this.submitting = false;
          });
        } else {
          api.item.create(itemData).then(response => {
            console.log('物品创建成功:', response.data);
            this.formData = {
              title: '',
              description: '',
              price: '',
              category: '',
              condition: 'new',
              location: '',
              images: []
            };
            this.submitting = false;
            this.$router.push({
              path: '/items',
              query: { success: '提交成功，物品将在管理员审核通过后展示给其他用户' }
            });
          }).catch(error => {
            console.error('物品创建失败:', error);
            this.errors.general = error.response?.data?.message || '发布失败，请稍后重试';
            this.submitting = false;
          });
        }
      } catch (error) {
        console.error('表单提交错误:', error);
        this.errors.general = '系统错误，请稍后重试';
        this.submitting = false;
      }
    },
    cancel() {
      if (this.submitting) return;
      
      // 检查表单是否有输入
      const hasInput = Object.values(this.formData).some(value => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value && value.trim() !== '';
      });
      
      if (hasInput && !confirm(this.isEdit ? '您确定要放弃修改吗？已填写的信息将丢失。' : '您确定要取消发布吗？已填写的信息将丢失。')) {
        return;
      }
      
      if (this.isEdit) {
        this.$router.push('/profile');
      } else {
        this.$router.push('/items');
      }
    }
  }
}
</script>

<style scoped>
/* 整体容器 */
.sell-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 标题样式 */
.sell-container h2 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
  text-align: center;
}

/* 表单样式 */
.sell-form {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

/* 表单组 */
.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

/* 价格输入框 */
.price-input-wrapper {
  position: relative;
}

.price-symbol {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 1.1rem;
}

.price-input-wrapper input {
  padding-left: 28px;
}

/* 字符计数 */
.char-count {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  text-align: right;
}

.char-count.char-limit {
  color: #e74c3c;
  font-weight: bold;
}

/* 错误消息 */
.error-message {
  display: block;
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* 图片上传区域 */
.image-upload-area {
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.image-upload-area:hover {
  border-color: #4a6fa5;
  background-color: #f8f9fa;
}

.image-upload-area input[type="file"] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-button svg {
  margin-bottom: 1rem;
}

.upload-button p {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-weight: bold;
}

/* 图片预览 */
.image-preview-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.image-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background-color: rgba(231, 76, 60, 0.9);
  color: white;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.remove-image:hover {
  background-color: rgba(231, 76, 60, 1);
}

/* 必填标记 */
.required {
  color: #e74c3c;
  font-size: 1.2rem;
  margin-left: 2px;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 2rem;
}

/* 按钮样式 */
.btn {
  display: inline-block;
  padding: 0.8rem 2rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: all 0.3s;
  cursor: pointer;
  border: none;
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

.btn-primary:disabled {
  background-color: #a0b4d0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #f4f4f4;
  color: #4a6fa5;
  border: 2px solid #4a6fa5;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e8e8e8;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-secondary:disabled {
  background-color: #f4f4f4;
  color: #a0b4d0;
  border-color: #a0b4d0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 加载状态 */
.loading {
  display: inline-block;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 帮助文本 */
.help-text {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sell-container {
    padding: 1rem;
  }
  
  .sell-container h2 {
    font-size: 1.5rem;
  }
  
  .sell-form {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .image-upload-area {
    padding: 1.5rem 1rem;
  }
  
  .image-preview-container {
    justify-content: center;
  }
  
  .image-preview {
    width: 100px;
    height: 100px;
  }
}
</style>
