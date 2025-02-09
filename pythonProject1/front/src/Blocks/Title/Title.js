import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './Title.css';

const EditablePageTitle = ({
  title,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setEditedTitle(title);
    }
  }, [title, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (editedTitle.trim() === '') {
      setEditedTitle(title);
      setIsEditing(false);
      return;
    }
  
    if (editedTitle.trim() !== title) {
      onSave(editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current.blur();
    } else if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onDelete();
  };

  return (
    <div className="editable-page-title">
      {isEditing ? (
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          className="editable-title-input"
        />
      ) : (
        <>
          <span
            className="editable-title-display"
            onClick={handleTitleClick}
            title="Нажмите для редактирования"
          >
            {title}
          </span>
          <button
            onClick={handleDelete}
            className="delete-page-button"
            title="Удалить страницу"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
};

EditablePageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default EditablePageTitle;