import React from 'react';
import PropTypes from 'prop-types';
import './ListBlock.css';

const ListBlock = ({
  block,
  isEditing,
  onStartEditingList,
  onBlurListBlock,
  onKeyDownListBlock,
}) => {
  if (!block.list_block) {
    return <p>(ㅤ)</p>;
  }

  if (isEditing) {
    let listContent = block.list_block.items || '';
    const listItems = listContent
      .split(/\r?\n/)
      .map((item) => `<li>${item.trim()}</li>`)
      .join('');

    return (
      <ul
        className="block-content editable-list"
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: listItems }}
        onBlur={(e) => onBlurListBlock(e, block)}
        onKeyDown={(e) => onKeyDownListBlock(e, block)}
      />
    );
  }

  // Режим просмотра
  if (!block.list_block.items) {
    return (
      <div onClick={() => onStartEditingList(block)} className="block-content">
        ㅤ
      </div>
    );
  }

  const itemsArr = block.list_block.items.split(/\r?\n/);
  return (
    <ul
      className="block-content"
      onClick={() => onStartEditingList(block)}
      style={{ cursor: 'text' }}
    >
      {itemsArr.map((item, idx) => (
        <li key={idx}>{item.trim()}</li>
      ))}
    </ul>
  );
};

ListBlock.propTypes = {
  block: PropTypes.shape({
    list_block: PropTypes.shape({
      items: PropTypes.string,
    }),
  }).isRequired,
  isEditing: PropTypes.bool.isRequired,
  onStartEditingList: PropTypes.func.isRequired,
  onBlurListBlock: PropTypes.func.isRequired,
  onKeyDownListBlock: PropTypes.func.isRequired,
};

export default ListBlock;