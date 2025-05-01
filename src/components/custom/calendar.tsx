'use client';

import { useState } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import { Card } from '../ui/card';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface JournalEntry {
  date: string;
  content: string;
  mood?: string;
}

interface CalendarProps {
  entries?: JournalEntry[];
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
  value?: Value;
  onChange?: (value: Value) => void;
  selectRange?: boolean;
}

export function JournalCalendar({
  entries = [],
  onDateRangeSelect,
  value,
  onChange,
  selectRange = true,
}: CalendarProps) {
  const [calendarValue, setCalendarValue] = useState<Value>(
    value || new Date()
  );
  const [activeDate, setActiveDate] = useState<Date | null>(null);

  // Function to check if a date has an entry
  const hasEntry = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.some((entry) => entry.date === dateStr);
  };

  // Handle date change
  const handleDateChange = (nextValue: Value) => {
    setCalendarValue(nextValue);
    if (onChange) {
      onChange(nextValue);
    }

    if (Array.isArray(nextValue) && nextValue[0] && nextValue[1]) {
      onDateRangeSelect?.(nextValue[0], nextValue[1]);
    } else if (nextValue instanceof Date) {
      setActiveDate(nextValue);
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasEntry(date)) {
      return (
        <div className="h-2 w-2 bg-[#01C269] rounded-full mx-auto mt-1"></div>
      );
    }
    return null;
  };

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
        value={calendarValue}
        tileContent={tileContent}
        tileClassName={tileClassName}
        className="border-0 w-full"
        selectRange={selectRange}
        nextLabel="›"
        next2Label="»"
        prevLabel="‹"
        prev2Label="«"
      />
    </Card>
  );
}
