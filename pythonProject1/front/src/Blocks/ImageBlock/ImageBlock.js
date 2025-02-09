// src/Blocks/ImageBlock/ImageBlock.js
import React from 'react';
import PropTypes from 'prop-types';
import './ImageBlock.css';

const ImageBlock = ({ block }) => {
  if (!block.image_block) {
    return <p>Изображение отсутствует</p>;
  }

  return (
    <img
      src={block.image_block.image}
      alt="Блок изображения"
      style={{ maxWidth: '100%', height: 'auto', marginTop: '10px' }}
    />
  );
};

ImageBlock.propTypes = {
  block: PropTypes.shape({
    image_block: PropTypes.shape({
      image: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

export default ImageBlock;
