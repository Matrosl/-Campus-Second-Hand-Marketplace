<template>
  <div class="app-container">
    <header class="app-header">
      <h1>校园二手交易平台</h1>
      <nav>
        <template v-if="isAdmin">
          <router-link to="/admin">后台管理</router-link>
          <button @click="logout" class="logout-btn">退出登录</button>
        </template>
        <template v-else>
          <router-link to="/">首页</router-link>
          <router-link to="/items">物品</router-link>
          <router-link to="/sell" v-if="isLoggedIn">发布</router-link>
          <router-link to="/messages" v-if="isLoggedIn">消息</router-link>
          <router-link to="/profile" v-if="isLoggedIn">我的</router-link>
          <router-link to="/login" v-if="!isLoggedIn">登录</router-link>
          <router-link to="/register" v-if="!isLoggedIn">注册</router-link>
          <button @click="logout" v-if="isLoggedIn" class="logout-btn">退出登录</button>
        </template>
      </nav>
    </header>
    
    <main class="app-main">
      <router-view />
    </main>
    
    <footer class="app-footer">
      <p>&copy; 2025 校园二手交易平台. 保留所有权利.</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false,
      isAdmin: false
    }
  },
  mounted() {
    this.checkLoginStatus();
  },
  watch: {
    $route() {
      this.checkLoginStatus();
    }
  },
  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem('token');
      this.isLoggedIn = !!token;
      if (token) {
        const raw = localStorage.getItem('userInfo') || '{}';
        let user = {};
        try {
          user = JSON.parse(raw);
        } catch (e) {
          user = {};
        }
        this.isAdmin = user && user.role === 'ADMIN';
      } else {
        this.isAdmin = false;
      }
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      this.isLoggedIn = false;
      this.isAdmin = false;
      this.$router.push('/login');
    }
  }
}
</script>

<style>
/* App specific styles */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #4a6fa5;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  font-size: 1.5rem;
  color: white; /* Ensure header title remains white */
}

.app-header nav {
  display: flex;
  gap: 1rem;
}

.app-header a {
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s;
  font-weight: 500;
}

.app-header a:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.app-header a.router-link-active {
  background-color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.app-header .logout-btn {
  background-color: transparent;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
}

.app-header .logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.app-main {
  flex: 1;
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background-color: #f4f4f4;
  text-align: center;
  padding: 1.5rem;
  margin-top: auto;
  border-top: 1px solid #e0e0e0;
}

/* Responsive design for app layout */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0.5rem;
  }
  
  .app-header h1 {
    font-size: 1.3rem;
  }
  
  .app-header nav {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .app-header a {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .app-main {
    padding: 1rem 0.5rem;
  }
  
  .app-footer {
    padding: 1rem 0.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .app-header nav {
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }
  
  .app-header a {
    width: 100%;
    text-align: center;
  }
}
</style>
