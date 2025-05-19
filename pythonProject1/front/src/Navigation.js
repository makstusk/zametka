import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';
import './Navigation.css';
import { FaPlus } from 'react-icons/fa';

const Navigation = ({ children }) => {
  // Объявление состояний
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacePages, setWorkspacePages] = useState({}); 
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 250;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false); 
  const [avatar, setAvatar] = useState(null); 
  const [isUploading, setIsUploading] = useState(false); 

  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const initialWidthRef = useRef(sidebarWidth);
  const inputRef = useRef(null); 
  const fileInputRef = useRef(null); 
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    initialWidthRef.current = sidebarWidth;
  }, []); 

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const response = await axiosInstance.get('calendar-events/upcoming/');
        setCalendarEvents(response.data);
      } catch (error) {
        console.error('Ошибка загрузки календарных событий:', error);
      }
    };

    fetchCalendarEvents();
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      try {
        const profileResponse = await axiosInstance.get('profile/');
        setUserInfo({
          id: profileResponse.data.user.id,
          username: profileResponse.data.user.username,
          avatar: profileResponse.data.avatar,
        });
        setAvatar(profileResponse.data.avatar);

        const workspaceResponse = await axiosInstance.get('workspaces/');
        const userWorkspaces = workspaceResponse.data.filter((workspace) =>
          workspace.members.includes(profileResponse.data.user.id)
        );
        setWorkspaces(userWorkspaces);

        const pagesData = {};
        for (const workspace of userWorkspaces) {
          try {
            const pagesResponse = await axiosInstance.get(`workspaces/${workspace.id}/pages/`);
            pagesData[workspace.id] = pagesResponse.data;
          } catch (error) {
            console.error(`Ошибка загрузки страниц для Workspace ID ${workspace.id}:`, error);
            pagesData[workspace.id] = []; 
          }
        }
        setWorkspacePages(pagesData);

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkAuthentication();
  }, [navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      const minWidth = 200; 
      const maxWidth = initialWidthRef.current; 

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
        localStorage.setItem('sidebarWidth', newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleShareWorkspace = async (workspaceId) => {
    // Запрашиваем у пользователя ID для добавления
    const userIdStr = window.prompt("Введите ID пользователя, с которым поделиться рабочим пространством:");
    if (!userIdStr) return;
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      alert("Неверный ID");
      return;
    }
  
    // Находим рабочее пространство по ID
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return;
  
    // Получаем текущий список участников, если его нет – создаём новый
    const currentMembers = workspace.members ? [...workspace.members] : [];
    
    // Проверяем, добавлен ли уже этот пользователь
    if (currentMembers.includes(userId)) {
      alert("Пользователь уже добавлен.");
      return;
    }
  
    // Добавляем нового участника
    currentMembers.push(userId);
  
    try {
      // Выполняем PATCH-запрос для обновления рабочего пространства
      const response = await axiosInstance.patch(`workspaces/${workspaceId}/`, { members: currentMembers });
      // Обновляем локальное состояние workspaces
      setWorkspaces(prevWorkspaces =>
        prevWorkspaces.map(w => w.id === workspaceId ? response.data : w)
      );
      alert("Пользователь успешно добавлен!");
    } catch (error) {
      console.error("Ошибка добавления пользователя:", error);
      alert("Ошибка при добавлении пользователя");
    }
  };


  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axiosInstance.post('logout/', { refresh_token: refreshToken });
      }
    } catch (err) {
      console.error('Ошибка при выходе из аккаунта:', err);
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUserInfo(null);
    navigate('/login');
  };

  const handleCreateWorkspace = async () => {
    try {
      const response = await axiosInstance.post('workspaces/', {
        name: 'newSpace',
      });
      setWorkspaces([...workspaces, response.data]);
      setWorkspacePages({ ...workspacePages, [response.data.id]: [] });
    } catch (error) {
      console.error('Ошибка создания рабочего пространства:', error);
      setError('Не удалось создать рабочее пространство.');
    }
  };

  const handleEditWorkspace = (workspaceId, currentName) => {
    setEditingWorkspaceId(workspaceId);
    setNewWorkspaceName(currentName);
  };

  const handleSaveWorkspaceName = async (workspaceId) => {
    if (!newWorkspaceName.trim()) {
      setError('Название рабочего пространства не может быть пустым.');
      return;
    }

    try {
      const response = await axiosInstance.patch(`workspaces/${workspaceId}/`, {
        name: newWorkspaceName,
      });
      setWorkspaces(
        workspaces.map((workspace) =>
          workspace.id === workspaceId ? response.data : workspace
        )
      );
      setEditingWorkspaceId(null);
      setNewWorkspaceName('');
      setError('');
    } catch (error) {
      console.error('Ошибка изменения названия рабочего пространства:', error);
      setError('Не удалось изменить название рабочего пространства.');
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    const confirmDelete = window.confirm('Вы уверены, что хотите удалить это рабочее пространство?');
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`workspaces/${workspaceId}/`);
      setWorkspaces(workspaces.filter((workspace) => workspace.id !== workspaceId));
      const updatedPages = { ...workspacePages };
      delete updatedPages[workspaceId];
      setWorkspacePages(updatedPages);
    } catch (error) {
      console.error('Ошибка удаления рабочего пространства:', error);
      setError('Не удалось удалить рабочее пространство.');
    }
  };

  const handleNavigateToPage = (pageId) => {
    navigate(`/pages/${pageId}`);
  };

  const handleCreateNewPage = async (workspaceId) => {
    const newPageTitle = 'newpage';

    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post(`/workspaces/${workspaceId}/pages/`, {
        title: newPageTitle,
      });
      setWorkspacePages((prevPages) => ({
        ...prevPages,
        [workspaceId]: [...prevPages[workspaceId], response.data],
      }));

    } catch (error) {
      console.error('Ошибка создания страницы:', error);
      setError('Не удалось создать страницу.');
    } finally {
      setIsLoading(false); 
    }
  };

  const handleWorkspaceNameBlur = (workspaceId) => {
    handleSaveWorkspaceName(workspaceId);
  };

  const handleWorkspaceNameKeyDown = (e, workspaceId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveWorkspaceName(workspaceId);
    } else if (e.key === 'Escape') {
      setEditingWorkspaceId(null);
      setNewWorkspaceName('');
      setError('');
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        alert('Пожалуйста, выберите изображение формата JPEG, PNG или GIF.');
        return;
      }

      const maxSizeInBytes = 2 * 1024 * 1024; 
      if (file.size > maxSizeInBytes) {
        alert('Размер изображения не должен превышать 2 МБ.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        handleAvatarChange(file); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
  
    try {
      const response = await axiosInstance.post('profile/upload-avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      setAvatar(response.data.avatar);
      setUserInfo((prevInfo) => ({
        ...prevInfo,
        avatar: response.data.avatar,
      }));
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      setError('Не удалось загрузить аватар. Попробуйте снова.');
    }
  };

  return (
    <div className="navigation-container">
      {}
      <div
        className="navigation-sidebar"
        style={{ width: sidebarWidth }}
        ref={sidebarRef}
      >
        {isAuthenticated && userInfo && (
          <div className="navigation-profile">
            <div
              className="avatar-container"
              onClick={handleAvatarClick}
              aria-label="Изменить аватар"
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAvatarClick();
              }}
            >
              <img
                src={avatar || userInfo.avatar}
                alt="Avatar"
                className="navigation-avatar-small"
              />
              <div className="avatar-overlay">
                <span className="plus-icon"><FaPlus /></span>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {isUploading && (
                <div className="avatar-loader">
                  <span className="loader"></span>
                </div>
              )}
            </div>
            <p className="navigation-username" title={`ID: ${userInfo.id}`}>{userInfo.username}</p>
            <button className="navigation-logout" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        )}

        <div>
          <div className="block-title">Пространства</div>
          <ul className="navigation-workspaces">
            {workspaces.map((workspace) => (
              <li key={workspace.id} className="navigation-workspace-item-container">
                <div className="navigation-workspace-header">
                  {editingWorkspaceId === workspace.id ? (
                    <input
                      type="text"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      onBlur={() => handleWorkspaceNameBlur(workspace.id)}
                      onKeyDown={(e) => handleWorkspaceNameKeyDown(e, workspace.id)}
                      autoFocus
                      ref={inputRef}
                      className="workspace-edit-input"
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <>
                      <span
                        className="navigation-workspace-name"
                      >
                        {workspace.name}
                      </span>
                      <div className="navigation-context-menu-wrapper">
                        <button className="navigation-add-button">
                          +
                        </button>
                        <div className="context-menu">
                          <div
                            className="context-menu-item"
                            onClick={() => handleEditWorkspace(workspace.id, workspace.name)}
                          >
                            rename
                          </div>
                          <div
                            className="context-menu-item"
                            onClick={() => handleCreateNewPage(workspace.id)}
                          >
                            {isLoading ? 'Создание...' : 'create'}
                          </div>
                          <div
                            className="context-menu-item"
                            onClick={() => handleDeleteWorkspace(workspace.id)}
                          >
                            delete
                          </div>
                          {/* Новая опция "share" для добавления пользователя */}
                          <div
                            className="context-menu-item"
                            onClick={() => handleShareWorkspace(workspace.id)}
                          >
                            share
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {}
                <ul className="navigation-pages-list">
                  {workspacePages[workspace.id] && workspacePages[workspace.id].map((page) => (
                    <li key={page.id} className="navigation-page-item">
                      <span
                        onClick={() => handleNavigateToPage(page.id)}
                        className="navigation-page-name"
                      >
                        {page.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="block-button"
          onClick={handleCreateWorkspace}
        >
          <div className="navigation-add-text">+ newSpace</div>
        </button>
        {/* Отображение ошибок */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {calendarEvents.length > 0 && (
          <div className="calendar-events-section">
            <ul className="calendar-events-list">
              {calendarEvents.map((event) => (
                <li key={event.id} className="calendar-event-item">
                  <div className="event-title">{event.title}</div>
                  <div className="event-date">
                    {new Date(event.start).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      

      {}
      <div
        className="resizer"
        onMouseDown={handleMouseDown}
      ></div>

      {}
      <div className="navigation-main-content">{children}</div>
    </div>
  );
};

export default Navigation;
