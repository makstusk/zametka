import React, { useRef, useState } from 'react';

const NavigationProfile = ({ userInfo, handleLogout, handleAvatarChange }) => {
  const fileInputRef = useRef(null);
  const [avatar, setAvatar] = useState(userInfo.avatar);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
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
        setIsUploading(true);
        handleAvatarChange(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="navigation-profile">
  <div className="avatar-container" onClick={handleAvatarClick}>
    <img
      src={avatar}
      alt="Avatar"
      className="navigation-avatar-small"
    />
    <div className="avatar-overlay">
      <span className="plus-icon">...</span>
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
  <p className="navigation-username">{userInfo.username}</p>
  <button className="navigation-logout" onClick={handleLogout}>
    Выйти
  </button>
</div>
  );
};

export default NavigationProfile;
