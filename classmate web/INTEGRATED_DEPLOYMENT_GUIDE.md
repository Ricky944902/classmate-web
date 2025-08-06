# 安全聊天应用部署指南（GitHub、MySQL、Vercel）

这份指南会详细讲解如何部署安全聊天应用，涵盖 GitHub 代码管理、MySQL 数据库配置和 Vercel 部署的全过程。即使你是编程新手，按照步骤操作也能成功部署。

## 前置条件

在开始部署前，你需要准备以下工具和账号：

1. **电脑**：Windows、Mac 或 Linux 系统均可
2. **网络连接**：稳定的互联网连接
3. **浏览器**：推荐 Chrome 或 Edge
4. **代码编辑器**：推荐 Visual Studio Code (VS Code)
5. **Git**：版本控制工具，用于管理代码
6. **Node.js 和 npm**：运行 JavaScript 代码的环境和包管理器
7. **GitHub 账号**：用于存储代码仓库
8. **Vercel 账号**：用于部署前端应用
9. **MySQL 数据库**：可以是本地安装或远程数据库服务（如 AWS RDS、阿里云 RDS 等）

### 安装必要软件

- **Git**：访问 [Git 官网](https://git-scm.com/) 下载并安装
- **Node.js 和 npm**：访问 [Node.js 官网](https://nodejs.org/) 下载并安装（推荐 LTS 版本）
- **VS Code**：访问 [VS Code 官网](https://code.visualstudio.com/) 下载并安装
- **MySQL**：
  - Windows：访问 [MySQL 官网](https://dev.mysql.com/downloads/installer/) 下载并安装
  - Mac：使用 Homebrew 安装 `brew install mysql`
  - Linux：使用包管理器安装（如 Ubuntu 下 `sudo apt install mysql-server`）

## 项目结构介绍

在部署前，先了解一下项目的基本结构：

```
classmate web/
├── backend/         # 后端代码
│   ├── .env         # 后端环境变量配置
│   ├── models/      # 数据模型
│   ├── package.json # 后端依赖
│   └── server.js    # 后端入口文件
├── frontend/        # 前端代码
│   ├── package.json # 前端依赖
│   ├── public/      # 静态资源
│   └── src/         # 源代码
├── README.md        # 项目说明
└── INTEGRATED_DEPLOYMENT_GUIDE.md # 部署指南
```

## 第一步：准备 GitHub 仓库

### 1. 创建 GitHub 账号

如果你还没有 GitHub 账号，访问 [GitHub 官网](https://github.com/) 注册一个。

### 2. 创建新仓库

- 登录 GitHub 后，点击右上角的 "+" 图标，选择 "New repository"
- 填写仓库名称（如 "classmate-web"）
- 选择仓库可见性（公开或私有）
- 勾选 "Add a README file"
- 点击 "Create repository"

### 3. 克隆仓库到本地

- 复制仓库的 HTTPS 或 SSH 链接
- 打开命令行终端
- 导航到你想存放项目的文件夹
- 运行命令：`git clone [仓库链接]`（将 [仓库链接] 替换为你复制的链接）
- 进入克隆的文件夹：`cd classmate-web`

## 第二步：配置 MySQL 数据库

### 1. 启动 MySQL 服务

- Windows：在开始菜单搜索 "Services"，找到 "MySQL" 服务并启动
- Mac：运行命令 `brew services start mysql`
- Linux：运行命令 `sudo systemctl start mysql`

### 2. 创建数据库和用户

- 打开命令行终端
- 登录 MySQL：`mysql -u root -p`（首次登录可能不需要密码，直接按回车）
- 创建数据库：`CREATE DATABASE classmate_web;`
- 创建用户：`CREATE USER 'classmate_user'@'localhost' IDENTIFIED BY 'your_password';`（将 your_password 替换为你的密码）
- 授予权限：`GRANT ALL PRIVILEGES ON classmate_web.* TO 'classmate_user'@'localhost';`
- 刷新权限：`FLUSH PRIVILEGES;`
- 退出 MySQL：`EXIT;`

### 3. 导入数据表结构

（如果项目提供了 SQL 脚本）

- 登录 MySQL：`mysql -u classmate_user -p classmate_web`
- 运行 SQL 脚本：`SOURCE path/to/your/sql/file.sql;`（替换为实际路径）
- 退出 MySQL：`EXIT;`

## 第三步：配置和运行后端

### 1. 复制项目文件到仓库

将项目的 `backend` 和 `frontend` 文件夹复制到刚才克隆的 GitHub 仓库文件夹中。

### 2. 配置后端环境变量

- 打开 `backend/.env` 文件（如果没有，创建一个）
- 添加以下配置：

```
# 服务器端口
PORT=5000

# 数据库配置
DB_HOST=localhost
DB_USER=classmate_user
DB_PASSWORD=your_password
DB_NAME=classmate_web
DB_PORT=3306

# JWT 密钥（用于身份验证）
JWT_SECRET=your_jwt_secret_key

# 其他配置
NODE_ENV=development
```

将 `your_password` 和 `your_jwt_secret_key` 替换为你自己的值。

### 3. 安装后端依赖

- 打开命令行终端
- 导航到后端文件夹：`cd backend`
- 安装依赖：`npm install`

### 4. 运行后端服务器

- 在后端文件夹中运行：`npm start`
- 看到类似 "Server running on port 5000" 和 "Connected to database" 的提示，表示后端运行成功

## 第四步：配置和运行前端

### 1. 配置前端环境变量

- 打开 `frontend/.env` 文件（如果没有，创建一个）
- 添加以下配置：

```
# 后端 API 地址
REACT_APP_API_URL=http://localhost:5000/api

# 其他配置
NODE_ENV=development
```

### 2. 安装前端依赖

- 打开新的命令行终端
- 导航到前端文件夹：`cd frontend`
- 安装依赖：`npm install`

### 3. 运行前端开发服务器

- 在前端文件夹中运行：`npm start`
- 自动打开浏览器，访问 http://localhost:3000
- 看到应用界面，表示前端运行成功

## 第五步：提交代码到 GitHub

### 1. 检查代码状态

- 打开命令行终端
- 导航到仓库根目录：`cd ..`（从 frontend 或 backend 文件夹）
- 运行：`git status`
- 会看到有未跟踪的文件（backend 和 frontend 文件夹）

### 2. 添加和提交代码

- 添加所有文件：`git add .`
- 提交代码：`git commit -m "Initial commit"`

### 3. 推送到 GitHub

- 运行：`git push origin main`
- 刷新 GitHub 仓库页面，会看到代码已经上传

## 第六步：部署前端到 Vercel

### 1. 登录 Vercel

访问 [Vercel 官网](https://vercel.com/)，使用 GitHub 账号登录。

### 2. 导入 GitHub 仓库

- 点击 "New Project"
- 选择 "Import Git Repository"
- 找到并选择你的仓库（classmate-web）
- 点击 "Import"

### 3. 配置 Vercel 项目

- 选择前端文件夹：在 "Root Directory" 下拉菜单中选择 "frontend"
- 配置环境变量：点击 "Environment Variables"，添加 `REACT_APP_API_URL`，值为你的后端 API 地址（如果后端已部署）
- 点击 "Deploy"

### 4. 等待部署完成

Vercel 会自动构建和部署你的前端应用。部署完成后，会显示一个 URL，你可以通过这个 URL 访问你的应用。

## 第七步：部署后端（可选）

如果需要将后端部署到云服务（如 Heroku、AWS、阿里云等），可以参考对应平台的文档。这里简单介绍一下部署到 Heroku 的步骤：

### 1. 登录 Heroku

访问 [Heroku 官网](https://www.heroku.com/)，注册并登录账号。

### 2. 创建 Heroku 应用

- 点击 "New" -> "Create new app"
- 填写应用名称，点击 "Create app"

### 3. 配置环境变量

- 点击 "Settings" -> "Config Vars" -> "Reveal Config Vars"
- 添加所有后端需要的环境变量（DB_HOST、DB_USER、DB_PASSWORD 等）

### 4. 部署代码

- 安装 Heroku CLI：访问 [Heroku CLI 官网](https://devcenter.heroku.com/articles/heroku-cli) 下载并安装
- 登录 Heroku：`heroku login`
- 添加 Heroku 远程仓库：`heroku git:remote -a your-app-name`（替换为你的应用名称）
- 推送代码：`git push heroku main`
- 启动应用：`heroku ps:scale web=1`

## 常见问题和故障排除

### 1. 数据库连接失败

- 检查 MySQL 服务是否启动
- 检查数据库配置是否正确（用户名、密码、数据库名称）
- 确保数据库用户有足够的权限

### 2. 后端启动失败

- 检查依赖是否安装完整：`npm install`
- 检查端口是否被占用：尝试修改 PORT 环境变量
- 查看错误信息，针对性解决

### 3. 前端无法访问后端 API

- 检查后端是否运行正常
- 检查前端配置的 API 地址是否正确
- 检查是否存在跨域问题（可以在后端添加 CORS 中间件）

### 4. 部署到 Vercel 后页面空白

- 检查 Vercel 构建日志，查看是否有错误
- 确保前端代码正确，特别是路由配置

## 总结

通过以上步骤，你应该已经成功部署了安全聊天应用。如果在部署过程中遇到问题，可以参考常见问题部分，或者在搜索引擎中搜索相关错误信息。祝你使用愉快！