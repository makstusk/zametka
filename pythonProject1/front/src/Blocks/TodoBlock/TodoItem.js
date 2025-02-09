import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

function TodoItem({
  block,
  item,
  index,
  isEditing,
  editingTodoText,
  handleBlurTodoItem,
  handleEnterKeyTodoItem,
  handleCheckTodoItem,
  handleStartEditingTodoItem,
  handleDeleteTodoItem,
}) {
  const itemRef = useRef(null);

  useEffect(() => {
    if (isEditing && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      const currentText = e.currentTarget.innerText.trim();
      if (currentText === '') {
        e.preventDefault();
        handleDeleteTodoItem(block, index);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleEnterKeyTodoItem(e, block, index);
    }
  };

  if (isEditing) {
    return (
      <li style={{ marginBottom: '5px' }}>
        <label
          style={{ cursor: 'pointer', marginRight: '5px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={item.done}
            disabled
            style={{ marginRight: '5px' }}
          />
        </label>
        <span
          ref={itemRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleBlurTodoItem(e, block, index)}
          onKeyDown={handleKeyDown}
          style={{ border: '1px dashed #888', padding: '2px', display: 'inline-block', minWidth: '200px' }}
        >
          {editingTodoText}
        </span>
      </li>
    );
  } else {
    return (
      <li
        style={{ marginBottom: '5px', cursor: 'text' }}
        onClick={() => handleStartEditingTodoItem(block, index)}
      >
        <label
          style={{ cursor: 'pointer', marginRight: '5px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => handleCheckTodoItem(block, index)}
            style={{ marginRight: '5px' }}
          />
        </label>
        <span>{item.text}</span>
      </li>
    );
  }
}

TodoItem.propTypes = {
  block: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isEditing: PropTypes.bool.isRequired,
  editingTodoText: PropTypes.string,
  handleBlurTodoItem: PropTypes.func.isRequired,
  handleEnterKeyTodoItem: PropTypes.func.isRequired,
  handleCheckTodoItem: PropTypes.func.isRequired,
  handleStartEditingTodoItem: PropTypes.func.isRequired,
  handleDeleteTodoItem: PropTypes.func.isRequired,
};

export default TodoItem;