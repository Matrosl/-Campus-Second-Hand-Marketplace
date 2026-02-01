<template>
  <div class="messages-container">
    <h2>消息</h2>
    
    <div class="messages-layout">
      <div class="conversations-list">
        <div 
          class="conversation-item" 
          v-for="conversation in conversations" 
          :key="conversation.id"
          :class="{ active: selectedConversation === conversation.id }"
          @click="selectConversation(conversation.id)"
        >
          <div class="conversation-avatar">
            <img :src="conversation.avatar" alt="用户头像">
            <div v-if="conversation.unreadCount > 0" class="unread-badge">{{ conversation.unreadCount }}</div>
          </div>
          <div class="conversation-info">
            <div class="conversation-name-time">
              <h3 class="conversation-name">{{ conversation.name }}</h3>
              <span class="conversation-time">{{ conversation.time }}</span>
            </div>
            <p class="conversation-last-message">
              <span v-if="conversation.lastMessage.fromMe" class="from-me-tag">我: </span>
              {{ conversation.lastMessage.content }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="messages-content" v-if="selectedConversation">
        <div class="messages-header">
          <h3>{{ currentConversation?.name }}</h3>
        </div>
        
        <div class="messages-body">
          <div 
            class="message" 
            :class="{ sent: message.fromMe, received: !message.fromMe }"
            v-for="message in currentMessages" 
            :key="message.id"
          >
            <div class="message-content">
              <p>{{ message.content }}</p>
            </div>
            <div class="message-time">{{ message.time }}</div>
          </div>
        </div>
        
        <div class="messages-footer">
          <input 
            type="text" 
            placeholder="输入您的消息..." 
            class="message-input"
            v-model="newMessage"
            @keyup.enter="sendMessage"
            :disabled="!selectedConversation"
          >
          <button class="send-btn" @click="sendMessage" :disabled="!selectedConversation || !newMessage.trim()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="messages-empty" v-else>
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>暂无消息</h3>
          <p>当有人与您联系时，消息会显示在这里</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api/index.js';

export default {
  name: 'MessagesView',
  data() {
    return {
      conversations: [],
      selectedConversation: null,
      newMessage: '',
      messages: {},
      allMessages: [],
      loading: true,
      error: null,
      userId: null,
      universityId: null
    }
  },
  async mounted() {
    this.initializeUserData();
    await this.fetchConversations();
    this.handleRouteConversation();
  },
  computed: {
    currentMessages() {
      if (!this.selectedConversation) return [];
      return this.messages[this.selectedConversation] || [];
    },
    currentConversation() {
      return this.conversations.find(conv => conv.id === this.selectedConversation);
    }
  },
  methods: {
    initializeUserData() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const mergedUser = {
        ...user,
        ...userInfo
      };
      this.userId = mergedUser.id;
      this.universityId = mergedUser.universityId || 1;
    },
    
    // 获取会话列表
    async fetchConversations() {
      if (!this.userId) {
        this.loading = false;
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        const response = await api.message.getUserMessages(this.userId);
        this.allMessages = response.data || [];

        const conversationsMap = {};
        this.allMessages.forEach(msg => {
          const isSender = msg.sender && msg.sender.id === this.userId;
          const otherUser = isSender ? msg.recipient : msg.sender;
          if (!otherUser) return;

          const convId = otherUser.id;
          const item = msg.item || null;
          if (!conversationsMap[convId]) {
            conversationsMap[convId] = {
              id: convId,
              userId: otherUser.id,
              name: otherUser.realName || otherUser.username || '用户',
              avatar: otherUser.avatarUrl || 'https://via.placeholder.com/150',
              unreadCount: 0,
              lastMessage: { fromMe: isSender, content: msg.content },
              time: this.formatDate(msg.createdAt),
              lastCreatedAt: msg.createdAt,
              itemId: item && item.id ? item.id : null
            };
          }

          const conv = conversationsMap[convId];
          if (msg.recipient && msg.recipient.id === this.userId && !msg.read) {
            conv.unreadCount += 1;
          }

          if (!conv.lastCreatedAt || new Date(msg.createdAt) > new Date(conv.lastCreatedAt)) {
            conv.lastMessage = { fromMe: isSender, content: msg.content };
            conv.time = this.formatDate(msg.createdAt);
            conv.lastCreatedAt = msg.createdAt;
            if (item && item.id) {
              conv.itemId = item.id;
            }
          }
        });

        this.conversations = Object.values(conversationsMap).sort((a, b) => {
          const ta = a.lastCreatedAt ? new Date(a.lastCreatedAt).getTime() : 0;
          const tb = b.lastCreatedAt ? new Date(b.lastCreatedAt).getTime() : 0;
          return tb - ta;
        });

        this.messages = {};
      } catch (error) {
        console.error('获取会话列表失败:', error);
        this.error = '获取会话列表失败，请稍后重试';
      } finally {
        this.loading = false;
      }
    },

    handleRouteConversation() {
      const query = this.$route && this.$route.query ? this.$route.query : {};
      const sellerId = query.sellerId;
      const sellerName = query.sellerName;
      const sellerAvatar = query.sellerAvatar;
      const itemId = query.itemId;

      if (!sellerId || !this.userId) {
        return;
      }

      const sellerIdNum = Number(sellerId);
      let conversation = this.conversations.find(
        conv => conv.userId === sellerIdNum || conv.id === sellerIdNum
      );

      if (!conversation) {
        conversation = {
          id: sellerIdNum,
          userId: sellerIdNum,
          name: sellerName || '用户',
          avatar: sellerAvatar || 'https://via.placeholder.com/150',
          unreadCount: 0,
          lastMessage: { fromMe: true, content: '' },
          time: '',
          lastCreatedAt: null,
          itemId: itemId ? Number(itemId) : null
        };
        this.conversations.unshift(conversation);
      } else if (itemId && !conversation.itemId) {
        conversation.itemId = Number(itemId);
      }

      this.selectedConversation = conversation.id;
      this.newMessage = '你好，我对你的物品很感兴趣。';
    },
    
    // 获取特定会话的消息
    async fetchMessages(conversationId) {
      if (!this.userId || !this.allMessages.length) return;

      const msgs = this.allMessages.filter(msg => {
        const isSender = msg.sender && msg.sender.id === this.userId;
        const otherUser = isSender ? msg.recipient : msg.sender;
        return otherUser && otherUser.id === conversationId;
      }).map(msg => ({
        id: msg.id,
        content: msg.content,
        fromMe: msg.sender && msg.sender.id === this.userId,
        time: this.formatDate(msg.createdAt),
        raw: msg
      }));

      this.messages[conversationId] = msgs;
    },
    
    // 选择会话
    async selectConversation(id) {
      this.selectedConversation = id;
      
      const conversation = this.conversations.find(conv => conv.id === id);
      if (conversation && conversation.unreadCount > 0) {
        await this.markConversationAsRead(id);
        conversation.unreadCount = 0;
      }
      
      if (!this.messages[id]) {
        await this.fetchMessages(id);
      }
    },
    
    // 发送消息
    async sendMessage() {
      if (this.newMessage.trim() && this.selectedConversation) {
        try {
          const messageData = {
            content: this.newMessage,
            sender: { id: this.userId },
            recipient: { id: this.currentConversation.userId }
          };
          
          if (this.currentConversation && this.currentConversation.itemId) {
            messageData.item = { id: this.currentConversation.itemId };
          }
          
          const response = await api.message.sendMessage(messageData);
          
          const newMsg = {
            id: response.data.id,
            content: response.data.content,
            fromMe: true,
            time: this.formatDate(response.data.createdAt),
            raw: response.data
          };
          
          if (!this.messages[this.selectedConversation]) {
            this.messages[this.selectedConversation] = [];
          }
          this.messages[this.selectedConversation].push(newMsg);
          this.allMessages.push(response.data);
          
          const conversation = this.conversations.find(conv => conv.id === this.selectedConversation);
          if (conversation) {
            conversation.lastMessage = { fromMe: true, content: this.newMessage };
            conversation.time = newMsg.time;
          }
          
          this.newMessage = '';
        } catch (error) {
          console.error('发送消息失败:', error);
          alert('发送消息失败，请稍后重试');
        }
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    },

    async markConversationAsRead(conversationId) {
      if (!this.userId || !this.allMessages.length) return;
      await this.fetchMessages(conversationId);
      const msgs = this.messages[conversationId] || [];
      for (const msg of msgs) {
        if (!msg.fromMe && msg.raw && msg.raw.id && !msg.raw.read) {
          try {
            await api.message.markAsRead(msg.raw.id);
            msg.raw.read = true;
          } catch (e) {
            console.error('标记单条消息为已读失败:', e);
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.messages-container {
  padding: 2rem 0;
}

.messages-container h2 {
  color: #4a6fa5;
  margin-bottom: 2rem;
  text-align: center;
}

.messages-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.conversations-list {
  border-right: 1px solid #eee;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid #eee;
}

.conversation-item:hover {
  background-color: #f9f9f9;
}

.conversation-item.active {
  background-color: #e8f4f8;
}

.conversation-avatar {
  margin-right: 1rem;
}

.conversation-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.conversation-avatar {
  position: relative;
}

.unread-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  background-color: #4a6fa5;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
}

.conversation-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.conversation-name-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.conversation-name {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin: 0;
}

.conversation-time {
  color: #999;
  font-size: 0.8rem;
  white-space: nowrap;
  margin-left: 0.5rem;
}

.conversation-last-message {
  color: #666;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.from-me-tag {
  color: #4a6fa5;
  font-weight: bold;
}

.messages-content {
  display: flex;
  flex-direction: column;
}

.messages-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
}

.messages-header h3 {
  margin: 0;
  color: #333;
}

.messages-body {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message.received {
  align-self: flex-start;
}

.message.sent {
  align-self: flex-end;
}

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 18px;
  margin-bottom: 0.25rem;
}

.message.received .message-content {
  background-color: #f4f4f4;
  border-bottom-left-radius: 4px;
}

.message.sent .message-content {
  background-color: #4a6fa5;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 0.8rem;
  color: #999;
  align-self: flex-end;
}

.messages-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 0.5rem;
  background-color: #f9f9f9;
}

.message-input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 1rem;
}

.send-btn {
  padding: 0.8rem 1.5rem;
  background-color: #4a6fa5;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.send-btn:hover {
  background-color: #3a5a85;
}

.messages-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 1.2rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .messages-container {
    padding: 1rem 0;
  }
  
  .messages-layout {
    grid-template-columns: 1fr;
    min-height: 500px;
  }
  
  .conversations-list {
    max-height: 200px;
  }
  
  .message {
    max-width: 85%;
  }
  
  .messages-footer {
    flex-direction: column;
  }
  
  .send-btn {
    width: 100%;
  }
}
</style>
