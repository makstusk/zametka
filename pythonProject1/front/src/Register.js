import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css'; 

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', {
        username,
        email,
        password,
      });
      navigate('/login');
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError('Не удалось зарегистрироваться. Попробуйте снова.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h1 className="auth-title">Регистрация</h1>
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Имя пользователя:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Повторите пароль:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="form-button">Зарегистрироваться</button>
        </form>
        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login" className="link">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
