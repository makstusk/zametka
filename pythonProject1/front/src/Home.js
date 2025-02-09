import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Состояние аутентификации
  const [userInfo, setUserInfo] = useState(null); // Состояние для имени и аватара пользователя
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Проверяем токен через запрос на профиль
        const response = await axiosInstance.get('profile/');
        setIsAuthenticated(true);
        setUserInfo({
          username: response.data.user.username,
          avatar: response.data.avatar,
        });
      } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axiosInstance.post('logout/', { refresh_token: refreshToken });
      }
    } catch (err) {
      console.error('Ошибка при выходе из аккаунта:', err);
    }

    // Очищаем токены и перенаправляем на домашнюю страницу
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUserInfo(null);
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #ccc' }}>
      
    </div>
  );
};

export default Home;
