<template>
  <div class="login-container">
    <div class="login-card">
      <h2>登录校园二手交易平台</h2>
      
      <form class="login-form" @submit.prevent="login">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input type="email" id="email" v-model="loginForm.email" placeholder="输入您的大学邮箱" required>
          <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input type="password" id="password" v-model="loginForm.password" placeholder="输入您的密码" required>
          <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
        </div>
        
        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" v-model="loginForm.rememberMe"> 记住我
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="submitting">登录</button>
      </form>
      
      <div class="login-footer">
        <p>还没有账号？ <router-link to="/register">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api/index.js';

export default {
  name: 'LoginView',
  data() {
    return {
      loginForm: {
        email: '',
        password: '',
        rememberMe: false
      },
      errors: {},
      submitting: false
    }
  },
  mounted() {
    // 如果本地存储中有记住的邮箱，自动填充
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.loginForm.email = rememberedEmail;
      this.loginForm.rememberMe = true;
    }
  },
  methods: {
    validateForm() {
      this.errors = {};
      
      // 验证邮箱
      if (!this.loginForm.email) {
        this.errors.email = '请输入邮箱地址';
      } else if (!this.isValidEmail(this.loginForm.email)) {
        this.errors.email = '请输入有效的邮箱地址';
      }
      
      // 验证密码
      if (!this.loginForm.password) {
        this.errors.password = '请输入密码';
      } else if (this.loginForm.password.length < 6) {
        this.errors.password = '密码长度不能少于6个字符';
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    async login() {
      if (this.validateForm()) {
        this.submitting = true;
        this.errors.general = '';
        
        try {
          const response = await api.user.login({
            email: this.loginForm.email,
            password: this.loginForm.password
          });
          
          localStorage.setItem('token', response.data.token);

          if (response.data && response.data.user) {
            localStorage.setItem('userInfo', JSON.stringify(response.data.user));
          }
          
          if (this.loginForm.rememberMe) {
            localStorage.setItem('rememberedEmail', this.loginForm.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          
          alert('登录成功！');
          const user = response.data && response.data.user ? response.data.user : null;
          if (user && user.role === 'ADMIN') {
            this.$router.push('/admin');
          } else {
            this.$router.push('/');
          }
        } catch (error) {
          console.error('登录失败:', error);
          this.errors.general = error.response?.data?.message || '登录失败，请检查邮箱和密码';
        } finally {
          this.submitting = false;
        }
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 2rem 0;
}

.login-card {
  background-color: white;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  color: #4a6fa5;
  margin-bottom: 2rem;
  text-align: center;
}

.login-form {
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

.form-group input {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  cursor: pointer;
}

.forgot-password {
  color: #4a6fa5;
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-password:hover {
  text-decoration: underline;
}

.btn {
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #4a6fa5;
  color: white;
}

.btn-primary:hover {
  background-color: #3a5a85;
}

.login-footer {
  margin-top: 1.5rem;
  text-align: center;
  color: #666;
}

.login-footer a {
  color: #4a6fa5;
  text-decoration: none;
  font-weight: bold;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.login-footer a:hover {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem 0;
  }
  
  .login-card {
    padding: 1.5rem;
    margin: 0 1rem;
  }
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
