import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import axios from 'axios';
import config from '../config';
import crypto from 'crypto';

// 解密函数
function decrypt(encryptedText, key) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.alloc(16, 0));
    let decrypted = decipher.update(Buffer.from(encryptedText, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('解密失败:', error);
    return '无法解密的消息';
  }
}

function Chat() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messageEndRef = useRef(null);
  const navigate = useNavigate();
  const { user, handleLogout, socket, encryptionKey } = useUserContext();

  // 滚动到最新消息
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 刷新联系人列表函数
  const refreshContacts = useCallback(async () => {
    if (!user) return;

    try {
      const res = await axios.get(`${config.apiUrl}/api/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 排除当前用户
      const filteredContacts = res.data.filter(contact => contact._id !== user.id);
      setContacts(filteredContacts);

      // 如果有联系人，默认选择第一个
      if (filteredContacts.length > 0 && !selectedContact) {
        setSelectedContact(filteredContacts[0]);
      }
    } catch (err) {
      console.error('获取联系人列表错误:', err);
      if (err.response?.status === 401) {
        handleLogout();
        navigate('/login');
      }
    }
  }, [user, selectedContact, navigate, handleLogout, config.apiUrl]);

  // 获取联系人列表
  useEffect(() => {
    refreshContacts();
  }, [user, selectedContact, navigate, handleLogout, refreshContacts]);

  // 刷新消息函数
  const refreshMessages = useCallback(async () => {
    if (!selectedContact || !user) return;

    try {
      const res = await axios.get(`${config.apiUrl}/api/messages/${selectedContact._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 解密消息
      const decryptedMessages = res.data.map(msg => ({
        ...msg,
        content: msg.isEncrypted ? decrypt(msg.content, encryptionKey) : msg.content
      }));

      setMessages(decryptedMessages);
    } catch (err) {
      console.error('获取消息历史错误:', err);
    }
  }, [selectedContact, user, encryptionKey, config.apiUrl]);

  // 获取消息历史
  useEffect(() => {
    refreshMessages();
  }, [selectedContact, user, encryptionKey, refreshMessages]);

  // 监听新消息
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessageReceived = (message) => {
      // 只处理当前选中联系人的消息
      if (message.sender === selectedContact?._id || message.recipient === selectedContact?._id) {
        const decryptedMessage = {
          ...message,
          content: message.isEncrypted ? decrypt(message.content, encryptionKey) : message.content
        };

        setMessages(prevMessages => [...prevMessages, decryptedMessage]);
      }
    };

    socket.on('messageReceived', handleMessageReceived);

    return () => {
      socket.off('messageReceived', handleMessageReceived);
    };
  }, [socket, selectedContact, encryptionKey, user]);

  // 消息发送后更新列表
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 搜索联系人
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(`${config.apiUrl}/api/users/search?query=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 排除当前用户
      const filteredResults = res.data.filter(result => result._id !== user.id);
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('搜索联系人错误:', err);
    }
  };

  // 刷新所有数据
  const refreshAll = () => {
    refreshContacts();
    if (selectedContact) {
      refreshMessages();
    }
  };

  // 发送消息
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedContact) return;

    try {
      // 发送消息到服务器
      socket.emit('sendMessage', {
        sender: user.id,
        recipient: selectedContact._id,
        content: newMessage,
        encryptionKey
      });

      // 清空输入框
      setNewMessage('');
    } catch (err) {
      console.error('发送消息错误:', err);
    }
  };

  if (!user) {
    return <div className="text-center text-gray-500 mt-8">请先登录</div>;
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">老同学交流平台</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshAll}
              className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-md text-sm transition duration-300"
            >
              刷新
            </button>
            <span className="text-sm hidden md:inline-block">欢迎, {user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-md text-sm transition duration-300"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* 左侧联系人面板 */}
        <div className="w-full md:w-80 bg-white rounded-lg shadow-md overflow-hidden">
          {/* 搜索框 */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索联系人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* 联系人列表 */}
          <div className="overflow-y-auto max-h-[calc(100vh-240px)]">
            {searchResults.length > 0 ? (
              <div className="p-2 border-b border-gray-200 text-sm font-medium text-gray-500">搜索结果</div>
            ) : null}

            {searchResults.map((contact) => (
              <div
                key={contact._id}
                onClick={() => {
                  setSelectedContact(contact);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className={`p-4 hover:bg-blue-50 cursor-pointer transition duration-300 ${selectedContact?._id === contact._id ? 'bg-blue-100' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    {contact.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{contact.username}</h3>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  </div>
                </div>
              </div>
            ))}

            {searchResults.length > 0 ? (
              <div className="p-2 border-b border-gray-200 text-sm font-medium text-gray-500 mt-2">联系人</div>
            ) : null}

            {contacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 hover:bg-blue-50 cursor-pointer transition duration-300 ${selectedContact?._id === contact._id ? 'bg-blue-100' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    {contact.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{contact.username}</h3>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧聊天面板 */}
        <div className="flex-grow flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
          {selectedContact ? (
            <>{
              /* 聊天头部 */
            }<div className="p-4 border-b border-gray-200 flex items-center space-x-3 bg-blue-600 text-white">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                {selectedContact.username.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-bold text-lg">{selectedContact.username}</h2>
            </div>

            {/* 聊天消息区域 */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 max-h-[calc(100vh-300px)]">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  还没有消息，开始聊天吧！
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${message.sender === user.id ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 rounded-bl-none'}`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70 text-right">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>

            {/* 消息输入区域 */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="输入消息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="btn-primary"
                >
                  发送
                </button>
              </form>
            </div>
          </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              请选择一个联系人开始聊天
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Chat;