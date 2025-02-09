import React, { useEffect, useState } from 'react';
import axiosInstance from './axiosInstance';

const WorkspaceList = () => {
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    // Запрос к API
    axiosInstance.get('workspaces/')
      .then((response) => {
        setWorkspaces(response.data);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке рабочих пространств:', error);
      });
  }, []);

  return (
    <div>
      <h1>Список рабочих пространств</h1>
      <ul>
        {workspaces.map((workspace) => (
          <li key={workspace.id}>{workspace.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default WorkspaceList;
