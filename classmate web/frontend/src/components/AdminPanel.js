import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';

function AdminPanel() {
  const navigate = useNavigate();
  const { handleLogout, user } = useUserContext();

  if (!user || !user.isAdmin) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">管理员面板</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">管理员, {user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-900 text-white px-3 py-1 rounded-md text-sm transition duration-300"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* 侧边栏导航 */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md overflow-hidden h-fit">
          <nav className="p-4">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/admin"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-md transition duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  用户列表
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/users"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-md transition duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  用户管理
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/profanity"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-md transition duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  敏感词管理
                </Link>
              </li>
              <li>
                <Link
                  to="/chat"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-md transition duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  返回聊天
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* 主内容区域 */}
        <div className="flex-grow bg-white rounded-lg shadow-md p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;