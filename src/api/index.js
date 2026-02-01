import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('Access forbidden: Campus restriction');
    }
    return Promise.reject(error);
  }
);

export const universityApi = {
  getAll() {
    return apiClient.get('/universities');
  },
  
  getById(id) {
    return apiClient.get(`/universities/${id}`);
  }
};

export const statisticsApi = {
  getStatistics() {
    return apiClient.get('/statistics');
  },
  
  getPopularItems(limit = 6) {
    return apiClient.get('/statistics/popular-items', {
      params: { limit }
    });
  },

  getItemStatus() {
    return apiClient.get('/statistics/item-status');
  },

  getItemCategory() {
    return apiClient.get('/statistics/item-category');
  }
};

export const categoryApi = {
  getAll() {
    return apiClient.get('/categories');
  },
  
  getById(id) {
    return apiClient.get(`/categories/${id}`);
  }
};

export const itemApi = {
  getAll(page = 0, size = 10) {
    return apiClient.get(`/items`, {
      params: { page, size }
    });
  },
  
  getById(id) {
    return apiClient.get(`/items/${id}`);
  },
  
  getBySeller(sellerId, page = 0, size = 10) {
    return apiClient.get(`/items/seller/${sellerId}`, {
      params: { page, size }
    });
  },

  getPending(page = 0, size = 10) {
    return apiClient.get('/items/pending', {
      params: { page, size }
    });
  },
  
  create(itemData) {
    return apiClient.post('/items', itemData);
  },
  
  update(id, itemData) {
    return apiClient.put(`/items/${id}`, itemData);
  },

  approve(id) {
    return apiClient.put(`/items/${id}/approve`);
  },

  reject(id) {
    return apiClient.put(`/items/${id}/reject`);
  },
  
  delete(id) {
    return apiClient.delete(`/items/${id}`);
  },
  
  search(search, page = 0, size = 10) {
    return apiClient.get('/items/search', {
      params: { search, page, size }
    });
  },
  
  filter(categoryId, condition, minPrice, maxPrice, location = null, page = 0, size = 10) {
    return apiClient.get('/items/filter', { 
      params: { categoryId, condition, minPrice, maxPrice, location, page, size } 
    });
  },
  
  getSimilarItems(itemId, page = 0, size = 6) {
    return apiClient.get(`/items/${itemId}/similar`, {
      params: { page, size }
    });
  },
  
  getLocations() {
    return apiClient.get('/items/locations');
  },

  analyzeImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/items/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const transactionApi = {
  getAll(page = 0, size = 10) {
    return apiClient.get('/transactions', {
      params: { page, size }
    });
  },
  
  getById(id) {
    return apiClient.get(`/transactions/${id}`);
  },
  
  getByBuyer(buyerId, page = 0, size = 10) {
    return apiClient.get(`/transactions/buyer/${buyerId}`, {
      params: { page, size }
    });
  },
  
  getBySeller(sellerId, page = 0, size = 10) {
    return apiClient.get(`/transactions/seller/${sellerId}`, {
      params: { page, size }
    });
  },
  
  getByUser(userId, page = 0, size = 10) {
    return apiClient.get(`/transactions/user/${userId}`, {
      params: { page, size }
    });
  },
  
  create(transactionData) {
    return apiClient.post('/transactions', transactionData);
  },
  
  updateStatus(id, status) {
    return apiClient.put(`/transactions/${id}/status`, { status });
  }
};

export const userApi = {
  register(userData) {
    return apiClient.post('/users/register', userData);
  },
  
  login(credentials) {
    return apiClient.post('/users/login', credentials);
  },
  
  getProfile(userId) {
    return apiClient.get(`/users/${userId}`);
  },
  
  updateProfile(userId, userData) {
    return apiClient.put(`/users/${userId}`, userData);
  },

  uploadAvatar(userId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const favoriteApi = {
  create(userId, itemId) {
    return apiClient.post('/favorites', { userId, itemId });
  },
  
  delete(userId, itemId) {
    return apiClient.delete('/favorites', {
      params: { userId, itemId }
    });
  },
  
  isFavorite(userId, itemId) {
    return apiClient.get('/favorites/check', {
      params: { userId, itemId }
    });
  },
  
  getUserFavorites(userId, page = 0, size = 10) {
    return apiClient.get('/favorites/user', {
      params: { userId, page, size }
    });
  }
};

export const reviewApi = {
  create(reviewData) {
    return apiClient.post('/reviews', reviewData);
  },
  
  getByItem(itemId) {
    return apiClient.get(`/reviews/item/${itemId}`);
  },
  
  getByUser(userId, page = 0, size = 10) {
    return apiClient.get(`/reviews/user/${userId}`, {
      params: { page, size }
    });
  }
};

export const messageApi = {
  getUserMessages(userId) {
    return apiClient.get(`/messages/user/${userId}`);
  },
  
  markAsRead(messageId) {
    return apiClient.put(`/messages/${messageId}/read`);
  },
  
  sendMessage(messageData) {
    return apiClient.post('/messages', messageData);
  },
  
  createConversation(conversationData) {
    return apiClient.post('/messages/conversations', conversationData);
  }
};

export default {
  university: universityApi,
  statistics: statisticsApi,
  item: itemApi,
  transaction: transactionApi,
  user: userApi,
  favorite: favoriteApi,
  review: reviewApi,
  message: messageApi,
  category: categoryApi
};
