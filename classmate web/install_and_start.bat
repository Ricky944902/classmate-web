@echo off

:: 检查是否已安装Node.js
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未找到Node.js。请先安装Node.js再运行此脚本。
    pause
    exit /b 1
)

:: 检查是否已安装npm
npm -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未找到npm。请先安装npm再运行此脚本。
    pause
    exit /b 1
)

:: 提示用户配置MySQL连接信息
echo 请确保已在backend\.env文件中配置了MySQL连接字符串
echo 格式: DB_URI=mysql://chat_user:your_secure_password@localhost:3306/classmate-chat
echo 请确保已安装MySQL并创建了classmate-chat数据库和chat_user用户
pause

:: 安装后端依赖
echo 正在安装后端依赖...
cd backend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 后端依赖安装失败。
    pause
    exit /b 1
)

:: 返回到项目根目录
cd ..

:: 安装前端依赖
echo 正在安装前端依赖...
cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 前端依赖安装失败。
    pause
    exit /b 1
)

:: 返回到项目根目录
cd ..

:: 启动后端服务
start "Backend Server" cmd /k "cd backend && npm start"

:: 等待后端服务启动
ping 127.0.0.1 -n 5 >nul

:: 启动前端服务
start "Frontend Server" cmd /k "cd frontend && npm start"

:: 显示启动成功信息
echo 应用已成功启动！
echo 后端服务运行在 http://localhost:5000
echo 前端服务运行在 http://localhost:3000

echo 请在浏览器中访问 http://localhost:3000 开始使用应用
pause