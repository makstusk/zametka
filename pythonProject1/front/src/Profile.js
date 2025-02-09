import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('profile/');
        setProfile(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        setError('Не удалось загрузить данные профиля');
      }
    };
  
    fetchProfile();
  }, []);
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await axiosInstance.post('logout/', { refresh_token: refreshToken });
      }
    } catch (err) {
      console.error('Ошибка при выходе из аккаунта:', err);
    }
    setProfile(null); // Очистка состояния профиля
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div>
      <h1>Профиль пользователя</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {profile ? (
        <div>
          <p><strong>Имя пользователя:</strong> {profile.user.username}</p>
          <p><strong>Email:</strong> {profile.user.email}</p>
          {profile.avatar && (
            <img src={profile.avatar} alt="Avatar" width="100" />
          )}
          <button onClick={handleLogout} style={{ marginTop: '20px' }}>
            Выйти из аккаунта
          </button>
        </div>
      ) : (
        !error && <p>Загрузка профиля...</p>
      )}
    </div>
  );
};

export default Profile;
