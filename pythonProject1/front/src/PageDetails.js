import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import TextBlock from './Blocks/TextBlock/TextBlock';
import ImageBlock from './Blocks/ImageBlock/ImageBlock';
import ListBlock from './Blocks/ListBlock/ListBlock';
import CalendarBlock from './Blocks/CalendarBlock/CalendarBlock';
import ToggleBlock from './Blocks/ToggleBlock/ToggleBlock';
import TodoBlock from './Blocks/TodoBlock/TodoBlock';
import Title from './Blocks/Title/Title';
import './Blocks/Blocks.css';
import './contexmenu.css'
import './Navigation.css'



const PageDetails = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState('');
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTodoBlockId, setEditingTodoBlockId] = useState(null);
  const [editingTodoIndex, setEditingTodoIndex] = useState(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const [isEditingPageTitle, setIsEditingPageTitle] = useState(false);
  const [editedPageTitle, setEditedPageTitle] = useState('');
  const [editingTodoTitleBlockId, setEditingTodoTitleBlockId] = useState(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingToggleTitleBlockId, setEditingToggleTitleBlockId] = useState(null);
  const [newToggleTitle, setNewToggleTitle] = useState('');
  const isEnterPressedRef = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetBlockId: null,
  });

  useEffect(() => {
    if (page) {
      setEditedPageTitle(page.title);
    }
    const fetchPageDetails = async () => {
      try {
        const pageResponse = await axiosInstance.get(`/pages/${pageId}/`);
        setPage(pageResponse.data);

        const blocksResponse = await axiosInstance.get(`/blocks/?page=${pageId}`);
        setBlocks(blocksResponse.data);
      } catch (err) {
        console.error('Ошибка загрузки страницы:', err);
        setError('Не удалось загрузить данные страницы.');
      }
    };

    fetchPageDetails();
  }, [pageId], [page]);

  ////////////////////////////////////////
  /////////БАЗОВЫЕ ФУНЦИИ/////////////////
  ////////////////////////////////////////

  const handleContextMenuPage = (e) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetBlockId: null,
    });
  };

  const handleContextMenuBlock = (blockId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetBlockId: blockId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const updateNestedBlock = (blocksArray, parentId, newBlock) => {
    return blocksArray.map((block) => {
      if (block.id === parentId) {
        return {
          ...block,
          children: block.children ? [...block.children, newBlock] : [newBlock],
        };
      } else if (block.children && block.children.length > 0) {
        return {
          ...block,
          children: updateNestedBlock(block.children, parentId, newBlock),
        };
      }
      return block;
    });
  };
  
  const updateNestedBlockData = (blocksArray, updatedBlock) => {
    return blocksArray.map((block) => {
      if (block.id === updatedBlock.id) {
        return { ...updatedBlock };
      }
      if (block.children && block.children.length > 0) {
        return { ...block, children: updateNestedBlockData(block.children, updatedBlock) };
      }
      return block;
    });
  };

  const handleCreateBlock = (type, parentId = null) => {
    if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const formData = new FormData();
          formData.append('page', pageId);
          if (parentId) formData.append('parent', parentId);
          formData.append('block_type', 'image');
          formData.append('image', file);
    
          const response = await axiosInstance.post(`/blocks/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
    
          if (parentId) {
            setBlocks((prev) => updateNestedBlock(prev, parentId, response.data));
          } else {
            setBlocks((prev) => [...prev, response.data]);
          }
          closeContextMenu();
        } catch (err) {
          console.error('Ошибка создания блока:', err);
          setError('Не удалось создать блок (image).');
        }
      };
      input.click();
      return;
    }
    
    (async () => {
      try {
        const formData = new FormData();
        formData.append('page', pageId);
        if (parentId) formData.append('parent', parentId);
        formData.append('block_type', type);
    
        if (type === 'text') {
          formData.append('content', '');
        } else if (type === 'list') {
          formData.append('items', '');
        } else if (type === 'calendar') {
          formData.append('events', JSON.stringify([]));
        } else if (type === 'toggle') {
          const title = prompt("Введите заголовок Toggle-блока:") || "";
          formData.append('title', title);
          formData.append('collapsed', 'false');
          formData.append('data', '[]');
        } else if (type === 'todo') {
          const title = prompt("Введите заголовок ToDo-блока:") || "";
          const initialItems = JSON.stringify([{ text: title, done: false }]);
          formData.append('title', title);
          formData.append('data', initialItems);
        }
    
        const response = await axiosInstance.post(`/blocks/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
    
        if (parentId) {
          setBlocks((prev) => updateNestedBlock(prev, parentId, response.data));
        } else {
          setBlocks((prev) => [...prev, response.data]);
        }
        closeContextMenu();
      } catch (err) {
        console.error('Ошибка создания блока:', err);
        setError('Не удалось создать блок.');
      }
    })();
  };
  
  const removeNestedBlock = (blocksArray, blockId) => {
    return blocksArray.reduce((acc, block) => {
      // Если текущий блок имеет тот же id, его просто не добавляем
      if (block.id === blockId) {
        return acc;
      }
      // Если у блока есть дочерние блоки, обновляем их, вызывая функцию рекурсивно
      let updatedBlock = { ...block };
      if (updatedBlock.children && updatedBlock.children.length > 0) {
        updatedBlock.children = removeNestedBlock(updatedBlock.children, blockId);
      }
      acc.push(updatedBlock);
      return acc;
    }, []);
  };
  
  const handleDeleteBlock = async (blockId) => {
    try {
      await axiosInstance.delete(`/blocks/${blockId}/`, {
        params: { page: pageId },
      });
      // Обновляем дерево блоков, удаляя блок с blockId
      setBlocks((prevBlocks) => removeNestedBlock(prevBlocks, blockId));
      closeContextMenu();
    } catch (err) {
      console.error('Ошибка удаления блока:', err);
      setError('Не удалось удалить блок.');
    }
  };

  const handleDeleteEvent = async (block, event) => {
      try {
        if (!window.confirm(`Вы уверены, что хотите удалить событие "${event.title}"?`))
          return;

        const updatedEvents = JSON.parse(block.calendar_block.events).filter(
          (e) =>
            e.start !== event.start ||
            e.end !== event.end ||
            e.title !== event.title
        );

        await updateCalendarBlock(block.id, updatedEvents);

        setBlocks(
          blocks.map((b) =>
            b.id === block.id
              ? {
                  ...b,
                  calendar_block: {
                    ...b.calendar_block,
                    events: JSON.stringify(updatedEvents),
                  },
                }
              : b
          )
        );
      } catch (err) {
        console.error('Ошибка удаления события:', err);
        setError('Не удалось удалить событие.');
      }
    };
    
  const handleAddEvent = async (block, slotInfo) => {
      try {
        const title = prompt('Введите название события:');
        if (!title) return;

        const newEvent = {
          title,
          start: slotInfo.start,
          end: slotInfo.end,
        };

        const updatedEvents = block.calendar_block.events
          ? [...JSON.parse(block.calendar_block.events), newEvent]
          : [newEvent];

        await updateCalendarBlock(block.id, updatedEvents);

        setBlocks(
          blocks.map((b) =>
            b.id === block.id
              ? {
                  ...b,
                  calendar_block: {
                    ...b.calendar_block,
                    events: JSON.stringify(updatedEvents),
                  },
                }
              : b
          )
        );
      } catch (err) {
        console.error('Ошибка добавления события:', err);
        setError('Не удалось добавить событие.');
      }
  };

  ////////////////////////////////////////
  /////////////////Title//////////////////
  ////////////////////////////////////////

  const handleSavePageTitle = async (newTitle) => {
    try {
      const formData = new FormData();
      formData.append('title', newTitle);
  
      await axiosInstance.patch(`/pages/${pageId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      setPage({ ...page, title: newTitle });
      setError('');
    } catch (err) {
      console.error('Ошибка изменения названия страницы:', err);
      setError('Не удалось изменить название страницы.');
    }
  };
  
  const handleDeletePage = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить эту страницу?')) return;
  
    try {
      await axiosInstance.delete(`/pages/${pageId}/`);
      navigate('/'); 
    } catch (err) {
      console.error('Ошибка удаления страницы:', err);
      setError('Не удалось удалить страницу.');
    }
  };

  ////////////////////////////////////////
  /////////////////Text///////////////////
  ////////////////////////////////////////

  const handleStartEditingText = (block) => {
    setEditingBlockId(block.id);
  };

  const handleBlurTextBlock = async (e, block) => {
    if (editingBlockId !== block.id) return;
  
    let htmlContent = e.currentTarget.innerHTML;
  
    let newText = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?div[^>]*>/gi, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '')
      .replace(/\n+/g, '\n')
      .replace(/[\u200B-\u200F\u00A0]/g, '')
      .trim();
  
    try {
      const formData = new FormData();
      formData.append('content', newText);
  
      await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { page: pageId },
      });
  
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === block.id
            ? { ...b, text_block: { ...b.text_block, content: newText } }
            : b
        )
      );
    } catch (err) {
      console.error('Ошибка сохранения текста:', err);
      setError('Не удалось сохранить текст.');
    }
  
    setEditingBlockId(null);
  };
  
  
  
  const handleKeyDownTextBlock = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
    }
  };
  
  ////////////////////////////////////////
  /////////////////List///////////////////
  ////////////////////////////////////////

  const handleStartEditingList = (block) => {
    setEditingBlockId(block.id);
    try {
      const lines = block.list_block.items.split(/\r?\n/).join('\n');
      setEditingContent(lines);
    } catch {
      setEditingContent('');
    }
  };

  const handleBlurListBlock = async (e, block) => {
    if (editingBlockId !== block.id) return;
    
    const newText = e.currentTarget.innerText;
    
    try {
      const formData = new FormData();
      formData.append('items', newText);
    
      const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { page: pageId },
      });
      
      // Обновляем дерево блоков рекурсивно
      setBlocks((prev) => updateNestedBlockData(prev, response.data));
    } catch (err) {
      console.error('Ошибка сохранения списка:', err);
      setError('Не удалось сохранить список.');
    }
    
    setEditingBlockId(null);
  };
  
  const handleKeyDownListBlock = (e, block) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
  
      const br = document.createElement('br');
      range.insertNode(br);
      range.setStartAfter(br);
    }
  };

  ////////////////////////////////////////
  /////////////////Toggle/////////////////
  ////////////////////////////////////////

  const handleStartEditingToggleTitle = (block) => {
    setEditingToggleTitleBlockId(block.id);
    setNewToggleTitle(block.toggle_block.title || '');
  };
  
  const handleChangeToggleTitle = (e) => {
    setNewToggleTitle(e.target.value);
  };
  
  const handleBlurToggleTitle = async (e, block) => {
    const updatedTitle = e.target.value.trim();
    if (!updatedTitle) {
      setError('Заголовок не может быть пустым.');
      return;
    }
    if (updatedTitle === block.toggle_block.title) {
      setEditingToggleTitleBlockId(null);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', updatedTitle);
  
      const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { page: pageId },
      });
      setBlocks((prev) => updateNestedBlockData(prev, response.data));
      setEditingToggleTitleBlockId(null);
      setError('');
    } catch (err) {
      console.error('Ошибка обновления заголовка Toggle:', err);
      setError('Не удалось обновить заголовок.');
    }
  };
  
  const handleEnterKeyToggleTitle = (e, block) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  };

  const handleToggleCollapsed = async (block) => {
    try {
      const newCollapsed = !block.toggle_block.collapsed;
      const formData = new FormData();
      formData.append('collapsed', newCollapsed.toString());
  
      const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { page: pageId },
      });
  
      setBlocks((prev) => updateNestedBlockData(prev, response.data));
    } catch (err) {
      console.error('Ошибка переключения сворачивания Toggle:', err);
      setError('Не удалось переключить свёрнутый список.');
    }
  };

 const handleStartEditingToggle = (block) => {
    setEditingBlockId(block.id);
    try {
      const dataArray = JSON.parse(block.toggle_block.data || '[]');
      const listContent = dataArray.join('\n');
      setEditingContent(listContent);
    } catch {
      setEditingContent('');
    }
  };  

  const handleBlurToggleItems = async (e, block) => {
    if (editingBlockId !== block.id) return;
    
    const htmlContent = e.currentTarget.innerHTML;
    const lines = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?div[^>]*>/g, '')
      .trim();
    
    const linesArray = lines.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    const newData = JSON.stringify(linesArray);
    
    try {
      const formData = new FormData();
      formData.append('data', newData);
    
      const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { page: pageId },
      });
      
      // Обновляем дерево блоков рекурсивно
      setBlocks((prev) => updateNestedBlockData(prev, response.data));
    } catch (err) {
      console.error('Ошибка сохранения Toggle:', err);
      setError('Не удалось сохранить Toggle.');
    }
    
    setEditingBlockId(null);
  };  

  const handleKeyDownToggleItems = (e, block) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
    }
  };

  ////////////////////////////////////////
  /////////////////Todo///////////////////
  ////////////////////////////////////////

  const handleCheckTodoItem = async (block, index) => {
    try {
      const todoArray = JSON.parse(block.todo_block.data || '[]');
      // Переключаем состояние чекбокса
      todoArray[index].done = !todoArray[index].done;
      const newData = JSON.stringify(todoArray);
  
      const formData = new FormData();
      formData.append('data', newData);
  
      // Отправляем обновление на сервер
      const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { page: pageId },
      });
  
      // Обновляем блоки локально с новым состоянием чекбокса
      setBlocks((prevBlocks) => 
        updateNestedBlockData(prevBlocks, response.data)
      );
    } catch (err) {
      console.error('Ошибка обновления ToDo:', err);
      setError('Не удалось обновить пункт todo.');
    }
  };
  
  const handleStartEditingTodoItem = (block, index) => {
    setEditingTodoBlockId(block.id);
    setEditingTodoIndex(index);
  
    try {
      const todoArray = JSON.parse(block.todo_block.data || "[]");
      const text = todoArray[index]?.text || "";
      setEditingTodoText(text);
    } catch {
      setEditingTodoText("");
    }
  };
  
  const handleBlurTodoItem = async (e, block, index) => {
    if (editingTodoBlockId !== block.id || editingTodoIndex !== index || isDeleting || isEnterPressedRef.current) {
      console.log(`Blur skip id ${index}`);
      return;
    }

    console.log(`Blur id ${index}`);

    const newText = e.currentTarget.innerText.trim();

    try {
      const todoArray = JSON.parse(block.todo_block.data || "[]");
      todoArray[index].text = newText;

      const newData = JSON.stringify(todoArray);
      const formData = new FormData();
      formData.append("data", newData);

      await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        params: { page: pageId },
      });

      setBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === block.id
            ? {
                ...b,
                todo_block: { ...b.todo_block, data: newData },
              }
            : b
        )
      );
    } catch (err) {
      console.error(`Error in handleBlurTodoItem for item id ${block.id}:`, err);
      setError("Не удалось сохранить текст.");
    }

    setEditingTodoBlockId(null);
    setEditingTodoIndex(null);
    setEditingTodoText("");
  };
  
  const handleAddTodoItem = async (block) => {
    const title = prompt('Введите текст задачи:');
    if (!title) return;
  
    try {
      const todoDataStr = block.todo_block.data;
      const todoArray = JSON.parse(todoDataStr);
      // Добавляем новую задачу
      todoArray.push({ text: title, done: false });
  
      const newData = JSON.stringify(todoArray);
      const formData = new FormData();
      formData.append('data', newData);
  
      const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { page: pageId },
      });
  
      // Обновляем блоки рекурсивно, включая вложенные
      setBlocks((prevBlocks) =>
        updateNestedBlockData(prevBlocks, response.data)
      );
    } catch (err) {
      console.error('Ошибка добавления пункта todo:', err);
      setError('Не удалось добавить пункт todo.');
    }
  };
  
  const handleEnterKeyTodoItem = async (e, block, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      isEnterPressedRef.current = true;
  
      console.log(`Enter id ${index}`);
  
      try {
        const todoArray = JSON.parse(block.todo_block.data || '[]');
  
        if (todoArray[index]) {
          todoArray[index].text = editingTodoText.trim();
        }
  
        // Создаем новый элемент
        const newItem = { text: '', done: false };
        todoArray.splice(index + 1, 0, newItem);
  
        const updatedData = JSON.stringify(todoArray);
        const formData = new FormData();
        formData.append('data', updatedData);
  
        const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { page: pageId },
        });
  
        // Обновляем блоки рекурсивно, включая вложенные
        setBlocks((prevBlocks) =>
          updateNestedBlockData(prevBlocks, response.data)
        );
  
        // Обновляем индексы редактируемых элементов
        setEditingTodoBlockId(block.id);
        setEditingTodoIndex(index + 1);
        setEditingTodoText('');
  
      } catch (err) {
        console.error(`Error in handleEnterKeyTodoItem for block id ${block.id}:`, err);
        setError('Не удалось создать новый элемент списка');
      } finally {
        // Сбрасываем флаг
        setTimeout(() => {
          isEnterPressedRef.current = false;
        }, 0);
      }
    }
  };
  
  const handleDeleteTodoItem = async (block, index) => {
    setIsDeleting(true);
    const todoArray = JSON.parse(block.todo_block.data || "[]");
  
    const deletedItemText = todoArray[index].text;
  
    todoArray.splice(index, 1);
  
    const newData = JSON.stringify(todoArray);
    const formData = new FormData();
    formData.append("data", newData);
  
    try {
      const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        params: { page: pageId },
      });
  
      // Обновляем состояние блоков с вложенными, если они есть
      setBlocks(prevBlocks => 
        updateNestedBlockData(prevBlocks, response.data)
      );
  
      console.log(`Deleted item: ${deletedItemText}`);
    } catch (err) {
      console.error("Ошибка при удалении элемента:", err);
      setError("Не удалось удалить элемент списка");
    }
  
    // Обновляем состояние для редактируемого элемента, если нужно
    if (index < todoArray.length) {
      setEditingTodoBlockId(block.id);
      setEditingTodoIndex(index);
      setEditingTodoText(todoArray[index]?.text || "");
    }
  
    setIsDeleting(false);
  };
  
  const handleStartEditingTodoTitle = (block) => {
    setEditingTodoTitleBlockId(block.id);
    setNewTodoTitle(block.todo_block.title || 'title');
  };

  const handleBlurTodoTitle = async (e, block) => {
    const updatedTitle = e.target.value.trim();
    if (!updatedTitle) {
      setError('Заголовок не может быть пустым.');
      return;
    }
  
    if (updatedTitle === block.todo_block.title) {
      setEditingTodoTitleBlockId(null);
      return;
    }
  
    try {
      // Формируем данные для обновления
      const formData = new FormData();
      formData.append('title', updatedTitle); // Отправляем только изменённый title
  
      // Отправляем PATCH-запрос с заголовком
      const response = await axiosInstance.patch(`/blocks/${block.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { page: block.page },
      });
  
      // Обновляем блоки локально с новым title, включая вложенные блоки
      setBlocks((prevBlocks) => 
        updateNestedBlockData(prevBlocks, response.data)
      );
  
      setEditingTodoTitleBlockId(null);
      setError('');
    } catch (err) {
      console.error('Ошибка обновления заголовка todo:', err);
      setError('Не удалось обновить заголовок.');
    }
  };
  
  const handleEnterKeyTodoTitle = async (e, block) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur(); 
    }
  };


  ////////////////////////////////////////
  /////////////////Calendar///////////////
  ////////////////////////////////////////

  const updateCalendarBlock = async (blockId, updatedEvents) => {
    const formData = new FormData();
    formData.append('events', JSON.stringify(updatedEvents));

    await axiosInstance.patch(`/blocks/${blockId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { page: pageId },
    });
  };

  

  const renderBlockContent = (block) => {
    let content;
    switch (block.block_type) {
      case 'text':
        content = (
          <TextBlock
            key={block.id}
            block={block}
            isEditing={editingBlockId === block.id}
            onStartEditingText={handleStartEditingText}
            onBlurTextBlock={handleBlurTextBlock}
            onKeyDownTextBlock={handleKeyDownTextBlock}
            error={error}
          />
        );
        break;
      case 'image':
        content = <ImageBlock key={block.id} block={block} />;
        break;
      case 'list':
        content = (
          <ListBlock
            key={block.id}
            block={block}
            isEditing={editingBlockId === block.id}
            onStartEditingList={handleStartEditingList}
            onBlurListBlock={handleBlurListBlock}
            onKeyDownListBlock={handleKeyDownListBlock}
          />
        );
        break;
      case 'calendar':
        content = (
          <CalendarBlock
            key={block.id}
            block={block}
            handleAddEvent={handleAddEvent}
            handleDeleteEvent={handleDeleteEvent}
          />
        );
        break;
      case 'toggle':
        content = (
          <ToggleBlock
            key={block.id}
            block={block}
            editingBlockId={editingBlockId}
            handleToggleCollapsed={handleToggleCollapsed}
            handleStartEditingToggle={handleStartEditingToggle}
            handleBlurToggleItems={handleBlurToggleItems}
            handleKeyDownToggleItems={handleKeyDownToggleItems}
            editingToggleTitleBlockId={editingToggleTitleBlockId}
            newToggleTitle={newToggleTitle}
            handleStartEditingToggleTitle={handleStartEditingToggleTitle}
            handleChangeToggleTitle={handleChangeToggleTitle}
            handleBlurToggleTitle={handleBlurToggleTitle}
            handleEnterKeyToggleTitle={handleEnterKeyToggleTitle}
          />
        );
        break;
      case 'todo':
        content = (
          <TodoBlock
            key={block.id}
            block={block}
            editingTodoBlockId={editingTodoBlockId}
            editingTodoIndex={editingTodoIndex}
            editingTodoText={editingTodoText}
            handleStartEditingTodoItem={handleStartEditingTodoItem}
            handleBlurTodoItem={handleBlurTodoItem}
            handleEnterKeyTodoItem={handleEnterKeyTodoItem}
            handleCheckTodoItem={handleCheckTodoItem}
            handleAddTodoItem={handleAddTodoItem}
            handleBlurTodoTitle={handleBlurTodoTitle}
            handleStartEditingTodoTitle={handleStartEditingTodoTitle}
            handleEnterKeyTodoTitle={handleEnterKeyTodoTitle}
            editingTodoTitle={editingTodoTitleBlockId === block.id}
            error={error}
            handleDeleteTodoItem={handleDeleteTodoItem}
          />
        );
        break;
      default:
        content = <p>Неизвестный тип блока</p>;
    }
  
    return (
      <div className="block-content">
        {content}
        {/* Проверка на наличие дочерних блоков */}
        {block.children && block.children.length > 0 && (
          <div className="nested-blocks">
            {block.toggle_block && block.toggle_block.collapsed ? null : (
              block.children.map((child) => (
                <div
                  key={child.id}
                  className="block-container"
                  onContextMenu={(e) => handleContextMenuBlock(child.id, e)}
                >
                  {renderBlockContent(child)} {/* Рекурсивный рендеринг дочерних блоков */}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
    
  };
  
  

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!page) {
    return <p>Загрузка...</p>;
  }

  return (
    <div style={{ minHeight: '100vh' }} onContextMenu={handleContextMenuPage}>
      <Title
        title={page.title}
        onSave={handleSavePageTitle}
        onDelete={handleDeletePage}
      />
  
      {blocks.map((block) => (
        <div
          className="block-container"
          key={block.id}
          onContextMenu={(e) => handleContextMenuBlock(block.id, e)}
        >
          {renderBlockContent(block)}
        </div>
      ))}
  
      {contextMenu.visible && (
        <div
          style={{
            position: 'absolute',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            zIndex: 999,
            padding: '5px',
            display: 'flex',
            flexDirection: 'row',
            gap: 'row',
          }}
          onMouseLeave={closeContextMenu}
        >
          {contextMenu.targetBlockId && (
        <div
          className="context-menu-item"
          onClick={() => handleDeleteBlock(contextMenu.targetBlockId)}
        >
          удалить
        </div>
      )}
      <div
          className="context-menu-item"
        >
          создать
        </div>

      <div className="submenu-title">
        <div className="select-block-type">
          <select
            className="block-type-select"
            onChange={(e) => handleCreateBlock(e.target.value, contextMenu.targetBlockId)}
          >
            <option value="text">Текст</option>
            <option value="image">Изображение</option>
            <option value="list">Список</option>
            <option value="calendar">Календарь</option>
            <option value="toggle">Toggle</option>
            <option value="todo">ToDo</option>
          </select>
        </div>
      </div>
    </div>
  )}
</div>
  );
  
};

export default PageDetails;