import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

function ProfanityList() {
  const [profanities, setProfanities] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { handleLogout } = useUserContext();
  const navigate = useNavigate();

  // 获取敏感词列表
  useEffect(() => {
    const fetchProfanities = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/profanity', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setProfanities(res.data);
        setLoading(false);
      } catch (err) {
        console.error('获取敏感词列表错误:', err);
        setError('获取敏感词列表失败');
        setLoading(false);
        if (err.response?.status === 401) {
          handleLogout();
          navigate('/login');
        }
      }
    };

    fetchProfanities();
  }, [handleLogout, navigate]);

  // 添加敏感词
  const addProfanity = async (e) => {
    e.preventDefault();

    if (!newWord.trim()) {
      setError('敏感词不能为空');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/profanity', {
        word: newWord
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 更新本地敏感词列表
      setProfanities([...profanities, { _id: res.data._id, word: newWord, createdAt: new Date() }]);
      setNewWord('');
      setSuccess('敏感词添加成功');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('添加敏感词错误:', err);
      setError(err.response?.data?.message || '添加敏感词失败');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 删除敏感词
  const deleteProfanity = async (id, word) => {
    if (window.confirm(`确定要删除敏感词 ${word} 吗？`)) {
      try {
        await axios.delete(`http://localhost:5000/api/profanity/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // 更新本地敏感词列表
        setProfanities(profanities.filter(profanity => profanity._id !== id));
        setSuccess(`敏感词 ${word} 删除成功`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('删除敏感词错误:', err);
        setError('删除敏感词失败');
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
        <h2 className="text-2xl font-bold text-gray-800">敏感词管理</h2>
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

      {/* 添加敏感词表单 */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-800 mb-4">添加敏感词</h3>
        <form onSubmit={addProfanity} className="flex space-x-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="输入敏感词..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="btn-primary"
          >
            添加
          </button>
        </form>
      </div>

      {/* 敏感词列表 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">敏感词</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">添加时间</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profanities.map((profanity) => (
              <tr key={profanity._id} className="hover:bg-blue-50 transition duration-300">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profanity._id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{profanity.word}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(profanity.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => deleteProfanity(profanity._id, profanity.word)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition duration-300"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profanities.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          暂无敏感词
        </div>
      )}
    </div>
  );
}

export default ProfanityList;