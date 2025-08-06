import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import config from '../config';

function TwoFactorAuth() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { login } = useUserContext();

  useEffect(() => {
    // 从URL参数获取邮箱
    const params = new URLSearchParams(window.location.search);
    const userEmail = params.get('email');
    if (userEmail) {
      setEmail(userEmail);
      // 请求发送验证码
      sendVerificationCode(userEmail);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // 发送验证码
  const sendVerificationCode = async (userEmail) => {
    try {
      await axios.post(`${config.apiUrl}/api/two-factor/send`, {
        email: userEmail
      });
      setSuccess('验证码已发送到您的邮箱');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('发送验证码错误:', err);
      setError('发送验证码失败，请重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 验证验证码
  const handleVerify = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('验证码不能为空');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${config.apiUrl}/api/two-factor/verify`, {
        email,
        code
      });

      // 登录成功，保存token并更新用户状态
      localStorage.setItem('token', res.data.token);
      await login(res.data.user);

      setLoading(false);
      // 根据用户角色重定向
      if (res.data.user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/chat');
      }
    } catch (err) {
      console.error('验证验证码错误:', err);
      setError(err.response?.data?.message || '验证码错误或已过期，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-blue-600">双因素认证</h2>
          <p className="text-gray-500 mt-2">请输入发送到您邮箱的验证码</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-4">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-md mb-4">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="输入6位验证码"
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => sendVerificationCode(email)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              重新发送验证码
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? '验证中...' : '验证并登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            返回登录页面
          </button>
        </div>
      </div>
    </div>
  );
}

export default TwoFactorAuth;