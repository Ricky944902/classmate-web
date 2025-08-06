import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { handleLogout, user } = useUserContext();
  const navigate = useNavigate();

  // 获取用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error('获取用户列表错误:', err);
        setError('获取用户列表失败');
        setLoading(false);
        if (err.response?.status === 401) {
          handleLogout();
          navigate('/login');
        }
      }
    };

    fetchUsers();
  }, [handleLogout, navigate]);

  // 更新用户角色
  const updateUserRole = async (userId, isAdmin) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${userId}/role`, {
        isAdmin
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 更新本地用户列表
      setUsers(users.map(user => {
        if (user._id === userId) {
          return { ...user, isAdmin };
        }
        return user;
      }));

      setSuccess(`用户 ${isAdmin ? '提升为管理员' : '降级为普通用户'} 成功`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('更新用户角色错误:', err);
      setError('更新用户角色失败');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 删除用户
  const deleteUser = async (userId, username) => {
    if (window.confirm(`确定要删除用户 ${username} 吗？`)) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // 更新本地用户列表
        setUsers(users.filter(user => user._id !== userId));

        setSuccess(`用户 ${username} 删除成功`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('删除用户错误:', err);
        setError('删除用户失败');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">用户管理</h2>
      </div>

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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">用户名</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">邮箱</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">注册时间</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">角色</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((userItem) => (
              <tr key={userItem._id} className="hover:bg-blue-50 transition duration-300">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem._id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(userItem.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${userItem.isAdmin ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {userItem.isAdmin ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {userItem._id !== user.id && (
                    <>{
                      /* 不能修改自己的角色 */
                    }<button
                      onClick={() => updateUserRole(userItem._id, !userItem.isAdmin)}
                      className={`mr-2 px-3 py-1 rounded text-xs ${userItem.isAdmin ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition duration-300`}
                    >
                      {userItem.isAdmin ? '取消管理员' : '设为管理员'}
                    </button>
                    <button
                      onClick={() => deleteUser(userItem._id, userItem.username)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition duration-300"
                    >
                      删除
                    </button>
                  </>)}
                  {userItem._id === user.id && (
                    <span className="text-gray-400 text-xs">无法修改自己</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;