// src/Blocks/CalendarBlock/CalendarBlock.js
import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarBlock = ({
  block,
  handleAddEvent,
  handleDeleteEvent,
}) => {
  if (!block.calendar_block) {
    return <p>События отсутствуют</p>;
  }

  return (
    <div style={{ height: '500px' }}>
      <Calendar
        localizer={localizer}
        events={JSON.parse(block.calendar_block.events)}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={(slotInfo) => handleAddEvent(block, slotInfo)}
        onSelectEvent={(event) => handleDeleteEvent(block, event)}
      />
    </div>
  );
};

CalendarBlock.propTypes = {
  block: PropTypes.shape({
    calendar_block: PropTypes.shape({
      events: PropTypes.string.isRequired,
    }),
  }).isRequired,
  handleAddEvent: PropTypes.func.isRequired,
  handleDeleteEvent: PropTypes.func.isRequired,
};

export default CalendarBlock;
