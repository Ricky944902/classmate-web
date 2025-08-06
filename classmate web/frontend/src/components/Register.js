import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const onChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // 验证表单
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${config.apiUrl}/api/register`, {
        username,
        email,
        password
      });

      setSuccess('注册成功，请登录');
      // 3秒后跳转到登录页面
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">老同学交流平台</h1>
          <p className="text-blue-100">创建您的账户</p>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md">
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-md">
              <p>{success}</p>
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-gray-700 font-medium mb-2">用户名</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={onChange}
                required
                className="input-field"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                className="input-field"
                placeholder="请输入邮箱"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">密码</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                required
                className="input-field"
                placeholder="请输入密码"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">确认密码</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                required
                className="input-field"
                placeholder="请再次输入密码"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>注册中...</span>
                </div>
              ) : (
                '立即注册'
              )}
            </button>
          </form>
          <div className="text-center text-sm text-gray-600 mt-4">
            已有账户？ <Link to="/login" className="font-medium text-blue-600 hover:text-blue-800 transition duration-300">立即登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;