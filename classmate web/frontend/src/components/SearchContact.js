import React, { useState } from 'react';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import config from '../config';

function SearchContact() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, socket } = useUserContext();

  // 搜索联系人
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setError('搜索内容不能为空');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${config.apiUrl}/api/users/search?query=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 过滤掉当前用户自己
      const filteredResults = res.data.filter(userResult => userResult._id !== user._id);
      setResults(filteredResults);
      setLoading(false);
    } catch (err) {
      console.error('搜索联系人错误:', err);
      setError('搜索联系人失败');
      setLoading(false);
    }
  };

  // 添加联系人
  const addContact = async (contactId, contactName) => {
    try {
      await axios.post(`${config.apiUrl}/api/contacts/request`, {
        contactId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 通过Socket通知对方
      socket.emit('addContact', { contactId, userId: user._id, userName: user.name });

      // 更新本地结果列表，标记为已添加
      setResults(results.map(result => 
        result._id === contactId ? { ...result, isAdded: true } : result
      ));
    } catch (err) {
      console.error('添加联系人错误:', err);
      setError(err.response?.data?.message || '添加联系人失败');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">搜索联系人</h3>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="输入用户名或邮箱搜索..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-4">
          <p>{error}</p>
        </div>
      )}

      {results.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500">搜索结果 ({results.length})</h4>
          <div className="divide-y divide-gray-200">
            {results.map((result) => (
              <div key={result._id} className="py-3 flex items-center justify-between hover:bg-blue-50 px-3 rounded-md transition duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {result.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{result.username}</p>
                    <p className="text-sm text-gray-500">{result.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => addContact(result._id, result.name)}
                  disabled={result.isAdded}
                  className={`px-3 py-1 rounded-md text-sm ${result.isAdded ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  {result.isAdded ? '已添加' : '添加联系人'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : searchTerm ? (
        <div className="text-center text-gray-500 py-8">
          没有找到匹配的联系人
        </div>
      ) : null}
    </div>
  );
}

export default SearchContact;