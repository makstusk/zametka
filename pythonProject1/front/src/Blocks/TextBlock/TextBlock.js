import React from 'react';
import PropTypes from 'prop-types';
import './TextBlock.css';

const TextBlock = ({
  block,
  isEditing,
  onStartEditingText,
  onBlurTextBlock,
  onKeyDownTextBlock,
  error,
}) => {
  if (!block.text_block) {
    return <p>Пустой текстовый блок</p>;
  }

  const { content } = block.text_block;

  const displayContent = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '')
    .replace(/\n/g, '<br>');

  const placeholderText = '';

  if (isEditing) {
    return (
      <div>
        <div
          className="block-text"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onBlurTextBlock(e, block)}
          onKeyDown={(e) => onKeyDownTextBlock(e, block)}
          dangerouslySetInnerHTML={{
            __html: content.trim() ? displayContent : placeholderText,
          }}
        />
        {error && <div className="text-block-error">{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <div
        className="block-text"
        onClick={() => onStartEditingText(block)}
        dangerouslySetInnerHTML={{
          __html: content.trim() ? displayContent : placeholderText,
        }}
      />
      {error && <div className="text-block-error">{error}</div>}
    </div>
  );
};

TextBlock.propTypes = {
  block: PropTypes.shape({
    id: PropTypes.number,
    text_block: PropTypes.shape({
      content: PropTypes.string,
    }),
  }).isRequired,
  isEditing: PropTypes.bool.isRequired,
  onStartEditingText: PropTypes.func.isRequired,
  onBlurTextBlock: PropTypes.func.isRequired,
  onKeyDownTextBlock: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default TextBlock;
