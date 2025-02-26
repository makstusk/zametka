import React from 'react';
import PropTypes from 'prop-types';
import './ToggleBlock.css';
import '../Blocks.css';
import '../TodoBlock/TodoBlock.css';

const ToggleBlock = ({
  block,
  editingBlockId,
  handleToggleCollapsed,
  handleStartEditingToggle,
  handleBlurToggleItems,
  handleKeyDownToggleItems,
  editingToggleTitleBlockId,
  newToggleTitle,
  handleStartEditingToggleTitle,
  handleChangeToggleTitle,
  handleBlurToggleTitle,
  handleEnterKeyToggleTitle,
}) => {
  if (!block.toggle_block) {
    return <p>Пустой Toggle</p>;
  }

  const tb = block.toggle_block;
  const isCollapsed = tb.collapsed; // Используем состояние collapsed для скрытия блоков
  const blockIsEditing = editingBlockId === block.id;
  const isEditingTitle = editingToggleTitleBlockId === block.id;

  const titleElement = isEditingTitle ? (
    <input
      type="text"
      autoFocus
      value={newToggleTitle}
      onChange={handleChangeToggleTitle}
      onBlur={(e) => handleBlurToggleTitle(e, block)}
      onKeyDown={(e) => handleEnterKeyToggleTitle(e, block)}
      className="todo-title-input"
    />
  ) : (
    <div
      className="block-title"
      onClick={() => handleStartEditingToggleTitle(block)}
    >
      {tb.title || 'Toggle'}
    </div>
  );

  let toggleData = [];
  try {
    toggleData = JSON.parse(tb.data);
  } catch {
    toggleData = [];
  }

  const toggleButton = (
    <button
      className="block-button"
      onClick={() => handleToggleCollapsed(block)}
    >
      {isCollapsed ? '\u25B6' : '\u25BC'}
    </button>
  );

  // Если collapsed, скрываем дочерние блоки
  if (isCollapsed && !blockIsEditing) {
    return (
      <div className="toggle-header">
        {toggleButton}
        {titleElement}
      </div>
    );
  }

  // Рендерим блок с вложенными данными
  if (blockIsEditing) {
    const listContent = toggleData.join('<br>');

    return (
      <div>
        <div className="toggle-header">
          {toggleButton}
          {titleElement}
        </div>

        <div
          className="block-content"
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: listContent }}
          onBlur={(e) => handleBlurToggleItems(e, block)}
          onKeyDown={(e) => handleKeyDownToggleItems(e, block)}
          style={{
            minHeight: '50px',
            marginTop: '5px',
            whiteSpace: 'pre-wrap',
          }}
        />
      </div>
    );
  }

  if (toggleData.length === 0) {
    return (
      <div>
        <div className="toggle-header">
          {toggleButton}
          {titleElement}
        </div>
        <div
          className="block-content"
          onClick={() => handleStartEditingToggle(block)}
        >
          Здесь пока ничего нет
        </div>
      </div>
    );
  }

  // Рендерим обычные элементы списка
  return (
    <div>
      <div className="toggle-header">
        {toggleButton}
        {titleElement}
      </div>
      <ul
        className="block-content"
        onClick={() => handleStartEditingToggle(block)}
      >
        {toggleData.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

ToggleBlock.propTypes = {
  block: PropTypes.object.isRequired,
  editingBlockId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  handleToggleCollapsed: PropTypes.func.isRequired,
  handleStartEditingToggle: PropTypes.func.isRequired,
  handleBlurToggleItems: PropTypes.func.isRequired,
  handleKeyDownToggleItems: PropTypes.func.isRequired,

  // Для заголовка Toggle
  editingToggleTitleBlockId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  newToggleTitle: PropTypes.string,
  handleStartEditingToggleTitle: PropTypes.func,
  handleChangeToggleTitle: PropTypes.func,
  handleBlurToggleTitle: PropTypes.func,
  handleEnterKeyToggleTitle: PropTypes.func,
};

export default ToggleBlock;
