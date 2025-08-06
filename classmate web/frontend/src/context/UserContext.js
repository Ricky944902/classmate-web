import { createContext, useContext } from 'react';

// 创建用户上下文
const UserContext = createContext(null);

// 自定义Hook，用于在组件中使用用户上下文
export function useUserContext() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
}

export { UserContext };