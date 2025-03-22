'use client';

import { useState } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import { Card } from './card';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface JournalEntry {
  date: string;
  content: string;
  mood?: string;
}

interface CalendarProps {
  entries?: JournalEntry[];
  onDateSelect?: (date: Date) => void;
}

export function JournalCalendar({ entries = [], onDateSelect }: CalendarProps) {
  const [value, setValue] = useState<Value>(new Date());
  const [activeDate, setActiveDate] = useState<Date | null>(null);

  // Function to check if a date has an entry
  const hasEntry = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.some((entry) => entry.date === dateStr);
  };

  // Handle date change
  const handleDateChange = (nextValue: Value) => {
    setValue(nextValue);
    if (nextValue instanceof Date) {
      setActiveDate(nextValue);
      onDateSelect?.(nextValue);
    }
  };

  // Custom tile content to show indicators for dates with entries
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasEntry(date)) {
      return (
        <div className="h-2 w-2 bg-[#01C269] rounded-full mx-auto mt-1"></div>
      );
    }
    return null;
  };

  // Custom tile className to style the active date
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (
      view === 'month' &&
      activeDate &&
      date.getDate() === activeDate.getDate() &&
      date.getMonth() === activeDate.getMonth() &&
      date.getFullYear() === activeDate.getFullYear()
    ) {
      return 'bg-[#1E4959] text-white rounded-lg';
    }
    return null;
  };

  return (
    <Card className="p-4 shadow-md bg-white">
      <Calendar
        onChange={handleDateChange}
        value={value}
        tileContent={tileContent}
        tileClassName={tileClassName}
        className="border-0 w-full"
        // Custom styling to match the app's design
        nextLabel="›"
        next2Label="»"
        prevLabel="‹"
        prev2Label="«"
      />
    </Card>
  );
}
