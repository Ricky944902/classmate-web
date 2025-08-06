import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';
import UserList from './components/admin/UserList';
import ProfanityList from './components/admin/ProfanityList';
import UserManagement from './components/admin/UserManagement';
import { UserContext } from './context/UserContext';
import config from './config';

// 创建Socket.io连接
const socket = io(config.apiUrl);

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState('');

  // 检查本地存储中的用户令牌
  useEffect(() => {
    const token = localStorage.getItem('token');
    const key = localStorage.getItem('encryptionKey');

    if (key) {
      setEncryptionKey(key);
    } else {
      // 生成新的加密密钥
      const newKey = generateEncryptionKey();
      setEncryptionKey(newKey);
      localStorage.setItem('encryptionKey', newKey);
    }

    if (token) {
      // 验证令牌并获取用户信息
      fetch(`${config.apiUrl}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          // 加入聊天室
          socket.emit('joinChat', { userId: data.user.id });
        } else {
          localStorage.removeItem('token');
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('验证令牌错误:', err);
        localStorage.removeItem('token');
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // 生成32字节的加密密钥
  function generateEncryptionKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // 登录处理
  const handleLogin = (userData) => {
    setUser(userData.user);
    localStorage.setItem('token', userData.token);
    // 加入聊天室
    socket.emit('joinChat', { userId: userData.user.id });
  };

  // 登出处理
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    // 离开聊天室
    socket.emit('leaveChat');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="text-blue-600 text-2xl font-bold">加载中...</div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, handleLogin, handleLogout, socket, encryptionKey }}>
      <Router>
        <Routes>
          {/* 登录页面 */}
          <Route path="/login" element={user ? <Navigate to="/chat" /> : <Login />} />

          {/* 注册页面 */}
          <Route path="/register" element={user ? <Navigate to="/chat" /> : <Register />} />

          {/* 聊天页面 */}
          <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />

          {/* 管理员面板 */}
          <Route path="/admin" element={user && user.isAdmin ? <AdminPanel /> : <Navigate to="/login" />}>
            <Route index element={<UserList />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="profanity" element={<ProfanityList />} />
          </Route>

          {/* 默认重定向到登录页面 */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;