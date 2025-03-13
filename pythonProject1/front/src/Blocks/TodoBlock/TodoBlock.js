// src/Blocks/TodoBlock/TodoBlock.js
import React from 'react';
import PropTypes from 'prop-types';
import TodoItem from './TodoItem';
import './TodoBlock.css';
import '../Blocks.css';

const TodoBlock = ({
  block,
  editingTodoBlockId,
  editingTodoIndex,
  editingTodoText,
  handleStartEditingTodoItem,
  handleBlurTodoItem,
  handleEnterKeyTodoItem,
  handleCheckTodoItem,
  handleAddTodoItem,
  handleBlurTodoTitle,
  handleStartEditingTodoTitle,
  handleEnterKeyTodoTitle,
  editingTodoTitle,
  error,
  handleDeleteTodoItem,
}) => {
  if (!block.todo_block) {
    return <p className="block-error">Нет данных todo_block</p>;
  }

  const todoTitle = block.todo_block.title;
  let todoList = [];
  try {
    todoList = JSON.parse(block.todo_block.data);
  } catch (err) {
    console.error("Ошибка парсинга todo_block.data:", err);
    todoList = [];
  }

  return (
    <div>
      <div className="block-title">
        {editingTodoTitle ? (
          <input
            type="text"
            defaultValue={todoTitle}
            onBlur={(e) => handleBlurTodoTitle(e, block)}
            onKeyDown={(e) => handleEnterKeyTodoTitle(e, block)}
            autoFocus
            className="todo-title-input"
          />
        ) : (
          <span
            onClick={() => handleStartEditingTodoTitle(block)}
            className="todo-title-text"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleStartEditingTodoTitle(block);
            }}
          >
            {todoTitle || '\u00A0'}
          </span>
        )}
      </div>
      <ul className="block-checkbox">
        {todoList.map((item, idx) => {
          const isEditing =
            editingTodoBlockId === block.id && editingTodoIndex === idx;

          return (
            <TodoItem
              key={idx}
              block={block}
              item={item}
              index={idx}
              isEditing={isEditing}
              editingTodoText={isEditing ? editingTodoText : item.text}
              handleBlurTodoItem={handleBlurTodoItem}
              handleEnterKeyTodoItem={handleEnterKeyTodoItem}
              handleCheckTodoItem={handleCheckTodoItem}
              handleStartEditingTodoItem={handleStartEditingTodoItem}
              handleDeleteTodoItem={handleDeleteTodoItem} 
            />
          );
        })}
      </ul>

      {error && <div className="block-error">{error}</div>}
    </div>
  );
};

TodoBlock.propTypes = {
  block: PropTypes.object.isRequired,
  editingTodoBlockId: PropTypes.number,
  editingTodoIndex: PropTypes.number,
  editingTodoText: PropTypes.string,
  handleStartEditingTodoItem: PropTypes.func.isRequired,
  handleBlurTodoItem: PropTypes.func.isRequired,
  handleEnterKeyTodoItem: PropTypes.func.isRequired,
  handleCheckTodoItem: PropTypes.func.isRequired,
  handleAddTodoItem: PropTypes.func.isRequired,
  handleBlurTodoTitle: PropTypes.func.isRequired,
  handleStartEditingTodoTitle: PropTypes.func.isRequired,
  handleEnterKeyTodoTitle: PropTypes.func.isRequired,
  editingTodoTitle: PropTypes.bool.isRequired,
  error: PropTypes.string,
  handleDeleteTodoItem: PropTypes.func.isRequired, 
};

export default TodoBlock;
