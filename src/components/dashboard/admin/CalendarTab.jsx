"use client";

import CalendarTab from '../hr/CalendarTab';

export default function AdminCalendarTab({ events, onEventCreate, onEventDelete }) {
  return (
    <CalendarTab 
      events={events} 
      onEventCreate={onEventCreate}
      onEventDelete={onEventDelete}
    />
  );
}
