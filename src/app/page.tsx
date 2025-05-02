'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAiPrompt } from '@/hooks/useAiPrompt';
import { useQuery } from '@tanstack/react-query';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, startOfMonth } from 'date-fns'; // Removed eachDayOfInterval, added isSameDay
import { fetchEntriesForMonth } from '@/lib/api'; // Use renamed function
import { Entry } from '@/index/entry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: user } = useUser();
  const aiPrompt = useAiPrompt();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const {
    data: monthEntries = [],
    isLoading: isLoadingMonthEntries,
    error: monthEntriesError,
  } = useQuery<Entry[], Error>({
    queryKey: ['monthEntries', format(currentMonth, 'yyyy-MM')],
    queryFn: () => fetchEntriesForMonth(format(currentMonth, 'yyyy-MM-dd')),
  });

  const entryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    monthEntries.forEach((entry) => {
      if (entry && typeof entry.journalDate === 'string') {
        const entryDateStr = entry.journalDate;
        counts[entryDateStr] = (counts[entryDateStr] || 0) + 1;
      } else {
        console.warn('Entry missing or has invalid journalDate:', entry);
      }
    });
    return counts;
  }, [monthEntries]);

  const selectedDayEntries = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return monthEntries.filter(
      (entry) =>
        entry &&
        typeof entry.journalDate === 'string' &&
        entry.journalDate === selectedDateStr
    );
  }, [monthEntries, selectedDate]);

  const handleRefetchPrompt = () => {
    aiPrompt.refetch();
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(startOfMonth(month));
    setSelectedDate(undefined);
  };

  const modifiers = useMemo(() => {
    const mods: Record<string, Date[]> = {
      low: [],
      medium: [],
      high: [],
      veryHigh: [],
    };

    for (const dateStr in entryCounts) {
      const count = entryCounts[dateStr];
      if (dateStr && !isNaN(new Date(dateStr).getTime())) {
        const date = new Date(dateStr);
        if (count === 1) mods.low.push(date);
        else if (count >= 2 && count <= 3) mods.medium.push(date);
        else if (count >= 4 && count <= 6) mods.high.push(date);
        else if (count > 6) mods.veryHigh.push(date);
      } else {
        console.warn('Invalid date string found in entryCounts:', dateStr);
      }
    }
    return mods;
  }, [entryCounts]);

  const modifiersStyles = {
    low: {
      textDecoration: 'underline',
      textDecorationColor: '#a7f3d0',
      textDecorationThickness: '3px',
      textUnderlineOffset: '0.4em',
    }, // Lightest green
    medium: {
      textDecoration: 'underline',
      textDecorationColor: '#34d399',
      textDecorationThickness: '3px',
      textUnderlineOffset: '0.4em',
    },
    high: {
      textDecoration: 'underline',
      textDecorationColor: '#059669',
      textDecorationThickness: '3px',
      textUnderlineOffset: '0.4em',
    },
    veryHigh: {
      textDecoration: 'underline',
      textDecorationColor: '#047857',
      textDecorationThickness: '3px',
      textUnderlineOffset: '0.4em',
    }, // Darkest green
    selected: { backgroundColor: '#06b6d4', color: 'white' },
    today: { fontWeight: 'bold', color: '#06b6d4' },
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 mt-16">
      <h1 className="text-2xl font-semibold mb-6">
        Welcome back, {user?.username || 'User'}!
      </h1>

      <Card className="mb-6 bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium text-gray-800">
            Daily AI prompt
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefetchPrompt}
            disabled={aiPrompt.isFetching}
            className="text-teal-600 hover:text-teal-700"
          >
          </Button>
        </CardHeader>
        <CardContent>
          {aiPrompt.isLoading && (
            <p className="text-gray-500 italic">Loading prompt...</p>
          )}
          {aiPrompt.isError && (
            <p className="text-red-600 italic">
              Error: {aiPrompt.error?.message}
            </p>
          )}
          {aiPrompt.data && (
            <blockquote className="border-l-4 border-teal-500 pl-4 py-2 bg-teal-50 rounded">
              <p className="text-gray-700 italic">{`"${aiPrompt.data}"`}</p>{' '}
            </blockquote>
          )}
          <Button
            onClick={handleRefetchPrompt}
            disabled={aiPrompt.isFetching}
            className="mt-3 bg-teal-600 hover:bg-teal-700 text-white text-sm py-1.5 px-3 rounded-md"
          >
            {aiPrompt.isFetching ? 'Generating...' : 'Generate new prompt'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onDayClick={handleDayClick}
            month={currentMonth}
            onMonthChange={handleMonthChange}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            showOutsideDays
            fixedWeeks
            className="w-full"
            classNames={{
              caption: 'flex justify-center items-center h-10 relative mb-2',
              caption_label: 'text-lg font-medium text-gray-800',
              nav: 'space-x-1',
              nav_button:
                'h-8 w-8 p-0 rounded-full hover:bg-gray-100 inline-flex justify-center items-center text-gray-600',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse mt-2',
              head_row: 'flex',
              head_cell:
                'w-[14.28%] text-gray-500 rounded-md font-normal text-[0.8rem] pb-1',
              row: 'flex w-full mt-1.5',
              cell: 'w-[14.28%] h-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-teal-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: 'h-10 w-10 p-0 font-normal rounded-full hover:bg-gray-100 inline-flex items-center justify-center aria-selected:opacity-100',
              day_selected:
                'bg-teal-600 text-white hover:bg-teal-700 focus:bg-teal-600 focus:text-white',
              day_today: 'bg-teal-100 text-teal-800 font-semibold',
              day_outside: 'text-gray-400 opacity-50',
              day_disabled: 'text-gray-400 opacity-50',
              day_range_middle:
                'aria-selected:bg-teal-100 aria-selected:text-current',
              day_hidden: 'invisible',
            }}
          />
        </Card>

        <Card className="lg:col-span-1 bg-white shadow-sm border border-gray-200 rounded-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-800">
              {selectedDate
                ? format(selectedDate, 'MMMM d, yyyy')
                : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 h-[400px] overflow-y-auto">
            {' '}
            {isLoadingMonthEntries ? (
              <p className="text-gray-500 italic">Loading month&#39;s entries...</p>
            ) : monthEntriesError ? (
              <p className="text-red-600 italic">
                Error loading month&#39;s entries:{' '}
                {monthEntriesError.message || 'Unknown error'}
              </p>
            ) : selectedDate ? (
              selectedDayEntries.length > 0 ? (
                <ul className="space-y-3">
                  {selectedDayEntries.map((entry) => (
                    <li
                      key={entry?.id?.toString() ?? Math.random().toString()}
                      className="border-l-4 border-teal-500 pl-3 py-1"
                    >
                      <p className="font-medium text-gray-800 truncate">
                        {entry?.title ?? 'Untitled Entry'}
                      </p>
                      {entry?.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.tags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No entries for this day.</p>
              )
            ) : (
              <p className="text-gray-500 italic">
                Click on a day in the calendar to see entries.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
