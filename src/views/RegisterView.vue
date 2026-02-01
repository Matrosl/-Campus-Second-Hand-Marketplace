<template>
  <div class="register-container">
    <div class="register-card">
      <h2>创建账号</h2>
      <p>加入校园交易社区，立即开始买卖！</p>
      
      <form class="register-form" @submit.prevent="register">
        <div class="form-group">
          <label for="username">用户名</label>
          <input type="text" id="username" v-model="registerForm.username" placeholder="设置用户名" required>
          <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
        </div>
        
        <div class="form-group">
          <label for="realName">真实姓名</label>
          <input type="text" id="realName" v-model="registerForm.realName" placeholder="输入您的真实姓名" required>
          <div v-if="errors.realName" class="error-message">{{ errors.realName }}</div>
        </div>
        
        <div class="form-group">
          <label for="email">大学邮箱</label>
          <input type="email" id="email" v-model="registerForm.email" placeholder="输入您的大学邮箱" required>
          <p class="help-text">请使用您的官方大学邮箱地址</p>
          <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
        </div>
        
        <div class="form-group">
          <label for="studentId">学号</label>
          <input type="text" id="studentId" v-model="registerForm.studentId" placeholder="输入您的学号" required>
          <div v-if="errors.studentId" class="error-message">{{ errors.studentId }}</div>
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input type="password" id="password" v-model="registerForm.password" placeholder="创建密码" required>
          <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
          <div v-if="passwordStrength" class="password-strength">
            <div class="strength-bar" :class="passwordStrength.level"></div>
            <span class="strength-text">{{ passwordStrength.text }}</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input type="password" id="confirmPassword" v-model="registerForm.confirmPassword" placeholder="确认密码" required>
          <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
        </div>
        
        <div class="form-group">
          <label class="terms-conditions">
            <input type="checkbox" v-model="registerForm.acceptTerms" required>
            我同意 <a href="#">条款与条件</a> 和 <a href="#">隐私政策</a>
          </label>
          <div v-if="errors.acceptTerms" class="error-message">{{ errors.acceptTerms }}</div>
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="submitting">注册</button>
      </form>
      
      <div class="register-footer">
        <p>已有账号？ <router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { userApi } from '../api/index.js';

export default {
  name: 'RegisterView',
  data() {
    return {
      registerForm: {
        username: '',
        realName: '',
        email: '',
        studentId: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
      },
      errors: {},
      passwordStrength: null,
      submitting: false
    }
  },
  watch: {
    'registerForm.password'(newPassword) {
      this.checkPasswordStrength(newPassword);
    }
  },
  methods: {
    validateForm() {
      this.errors = {};
      
      // 验证用户名
      if (!this.registerForm.username.trim()) {
        this.errors.username = '请输入用户名';
      } else if (this.registerForm.username.length > 50) {
        this.errors.username = '用户名不能超过50个字符';
      }
      
      // 验证真实姓名
      if (!this.registerForm.realName.trim()) {
        this.errors.realName = '请输入您的真实姓名';
      } else if (this.registerForm.realName.length > 50) {
        this.errors.realName = '真实姓名不能超过50个字符';
      }
      
      // 验证邮箱
      if (!this.registerForm.email) {
        this.errors.email = '请输入大学邮箱';
      } else if (!this.isValidEmail(this.registerForm.email)) {
        this.errors.email = '请输入有效的邮箱地址';
      } else if (!this.isUniversityEmail(this.registerForm.email)) {
        this.errors.email = '请使用大学官方邮箱注册';
      }
      
      // 验证学号
      if (!this.registerForm.studentId.trim()) {
        this.errors.studentId = '请输入您的学号';
      } else if (this.registerForm.studentId.length > 20) {
        this.errors.studentId = '学号不能超过20个字符';
      }
      
      // 验证密码
      if (!this.registerForm.password) {
        this.errors.password = '请创建密码';
      } else if (this.registerForm.password.length < 8) {
        this.errors.password = '密码长度不能少于8个字符';
      } else if (this.passwordStrength && this.passwordStrength.level === 'weak') {
        this.errors.password = '密码强度太弱，请包含字母、数字和特殊字符';
      }
      
      // 验证确认密码
      if (!this.registerForm.confirmPassword) {
        this.errors.confirmPassword = '请确认密码';
      } else if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.errors.confirmPassword = '两次输入的密码不一致';
      }
      
      // 验证条款同意
      if (!this.registerForm.acceptTerms) {
        this.errors.acceptTerms = '请同意条款与条件';
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    isUniversityEmail(email) {
      // 简单检测大学邮箱域名，实际项目中可以根据具体需求扩展
      const universityDomains = ['.edu', '.ac', '.school', '.university', 'edu.cn'];
      return universityDomains.some(domain => email.toLowerCase().includes(domain));
    },
    
    checkPasswordStrength(password) {
      if (!password) {
        this.passwordStrength = null;
        return;
      }
      
      let strength = { level: 'weak', text: '弱' };
      let score = 0;
      
      // 长度检测
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      
      // 字符类型检测
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^a-zA-Z\d]/.test(password)) score++;
      
      // 确定强度等级
      if (score >= 4) {
        strength = { level: 'strong', text: '强' };
      } else if (score >= 2) {
        strength = { level: 'medium', text: '中' };
      }
      
      this.passwordStrength = strength;
    },
    
    register() {
      if (this.validateForm()) {
        this.submitting = true;
        
        const userData = {
          username: this.registerForm.username,
          realName: this.registerForm.realName,
          email: this.registerForm.email,
          studentId: this.registerForm.studentId,
          password: this.registerForm.password
        };
        
        userApi.register(userData)
          .then(response => {
            this.submitting = false;
            alert('注册成功！请登录。');
            this.$router.push('/login');
          })
          .catch(error => {
            this.submitting = false;
            console.error('注册失败:', error);
            if (error.response?.data?.message) {
              alert(`注册失败: ${error.response.data.message}`);
            } else {
              alert('注册失败，请稍后重试。');
            }
          });
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 2rem 0;
}

.register-card {
  background-color: white;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

.register-card h2 {
  color: #4a6fa5;
  margin-bottom: 0.5rem;
  text-align: center;
}

.register-card p {
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
}

.register-form {
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

.help-text {
  font-size: 0.8rem;
  color: #999;
  margin: 0.25rem 0 0 0;
}

.terms-conditions {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-weight: normal;
  color: #666;
  cursor: pointer;
}

.terms-conditions a {
  color: #4a6fa5;
  text-decoration: none;
}

.terms-conditions a:hover {
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

.register-footer {
  margin-top: 1.5rem;
  text-align: center;
  color: #666;
}

.register-footer a {
  color: #4a6fa5;
  text-decoration: none;
  font-weight: bold;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Password strength indicator */
.password-strength {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  transition: background-color 0.3s;
}

.strength-bar.weak {
  background-color: #dc3545;
}

.strength-bar.medium {
  background-color: #ffc107;
}

.strength-bar.strong {
  background-color: #28a745;
}

.strength-text {
  font-size: 0.8rem;
  font-weight: bold;
}

.strength-text.weak {
  color: #dc3545;
}

.strength-text.medium {
  color: #ffc107;
}

.strength-text.strong {
  color: #28a745;
}

.register-footer a:hover {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
  .register-container {
    padding: 1rem 0;
  }
  
  .register-card {
    padding: 1.5rem;
    margin: 0 1rem;
  }
  
  .terms-conditions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>