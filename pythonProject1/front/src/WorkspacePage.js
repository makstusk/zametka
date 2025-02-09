import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Подключаем useNavigate
import axiosInstance from './axiosInstance';

const WorkspacePage = () => {
  const { id } = useParams(); // Получаем ID рабочего пространства из URL
  const [pages, setPages] = useState([]); // Список страниц
  const [newPageTitle, setNewPageTitle] = useState(''); // Название новой страницы
  const [error, setError] = useState(''); // Ошибка
  const navigate = useNavigate(); // Хук для навигации

  // Функция для получения списка страниц
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await axiosInstance.get(`/workspaces/${id}/pages/`);
        setPages(response.data); // Устанавливаем список страниц
      } catch (err) {
        setError('Не удалось загрузить страницы.');
      }
    };

    fetchPages();
  }, [id]);

  // Функция для создания новой страницы
  const handleCreatePage = async () => {
    if (!newPageTitle) {
      setError('Название страницы не может быть пустым.');
      return;
    }
  
    try {
      const response = await axiosInstance.post(`/workspaces/${id}/pages/`, {
        title: newPageTitle, // Отправляем только title
      });
      setPages([...pages, response.data]); // Обновляем список страниц
      setNewPageTitle('');
    } catch (err) {
      console.error('Ошибка создания страницы:', err);
      setError('Не удалось создать страницу.');
    }
  };
  
  // Функция для перехода на страницу Page
  const handleNavigateToPage = (pageId) => {
    navigate(`/pages/${pageId}`); // Переход на страницу Page
  };

  return (
    <div>
      <h1>Страницы</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
  {pages.map((page) => (
    <li key={page.id} style={{ marginBottom: '10px' }}>
      <span
        onClick={() => handleNavigateToPage(page.id)} // Переход по клику
        style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
      >
        {page.title} {/* Отображение поля title */}
      </span>
    </li>
  ))}
</ul>

      <input
        type="text"
        value={newPageTitle}
        onChange={(e) => setNewPageTitle(e.target.value)}
        placeholder="Название страницы"
      />
      <button onClick={handleCreatePage}>Создать страницу</button>
    </div>
  );
};

export default WorkspacePage;
