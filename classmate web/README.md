# 安全聊天应用

这是一个功能完整的安全聊天应用，包含端到端加密、敏感词过滤、用户认证和管理员面板等功能。

## 项目结构

```
├── README.md
├── backend/
│   ├── .env         # 环境变量配置
│   ├── package.json # 后端依赖
│   └── server.js    # 后端主文件
└── frontend/
    ├── package.json # 前端依赖
    ├── public/
    │   └── index.html # 前端入口HTML
    └── src/
        ├── App.js          # 前端主组件
        ├── index.js        # 前端入口文件
        ├── index.css       # 全局样式
        ├── context/
        │   └── UserContext.js # 用户上下文管理
        └── components/
            ├── Login.js        # 登录组件
            ├── Register.js     # 注册组件
            ├── Chat.js         # 聊天组件
            ├── SearchContact.js # 联系人搜索组件
            ├── TwoFactorAuth.js # 双因素认证组件
            ├── AdminPanel.js   # 管理员面板
            └── admin/
                ├── UserList.js      # 用户列表
                ├── UserManagement.js # 用户管理
                └── ProfanityList.js  # 敏感词管理
```

## 功能特点

1. **用户认证**：注册、登录、双因素认证
2. **聊天功能**：端到端加密、消息历史记录
3. **联系人管理**：添加、搜索联系人
4. **敏感词过滤**：自动检测和过滤敏感内容
5. **管理员面板**：用户管理、敏感词管理
6. **数据加密**：密码哈希、聊天内容加密

## 技术栈

- **后端**：Node.js, Express, MongoDB, Mongoose
- **前端**：React, Tailwind CSS, Socket.io-client
- **认证**：JWT, 双因素认证
- **加密**：bcryptjs, 自定义加密算法

## 安装指南

### 前提条件
- Node.js (v14+)
- MongoDB (本地或Atlas)

### 后端安装
1. 进入后端目录
```bash
cd backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
编辑 `.env` 文件，设置以下变量：
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/secure_chat
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

4. 启动后端服务器
```bash
npm start
# 或使用nodemon进行开发
npm run dev
```

### 前端安装
1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动前端开发服务器
```bash
npm start
```

## 使用说明

1. 访问 `http://localhost:3000` 打开应用
2. 注册新用户或登录现有用户
3. 如果启用了双因素认证，输入邮箱接收的验证码
4. 搜索并添加联系人
5. 开始安全聊天
6. 管理员用户可以访问 `/admin` 进入管理面板

## 安全特性

- 密码使用bcrypt进行哈希存储
- 聊天消息使用AES算法加密
- 使用JWT进行身份验证
- 双因素认证增强账户安全
- 敏感词自动过滤

## 注意事项

1. 确保MongoDB服务正在运行
2. 开发环境下，前端会自动代理API请求到后端
3. 生产环境需要配置适当的CORS和安全设置
4. 敏感词过滤功能需要在管理员面板中预先配置