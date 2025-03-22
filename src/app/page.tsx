'use client';

import { getUser } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { JournalCalendar } from '@/components/ui/calendar';
import { Analytics } from '@/components/ui/analytics';
import { useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import './calendar.css';

export default function Home() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    retry: false,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock analytics data for demonstration
  const mockAnalyticsData = {
    totalEntries: 13,
    mostUsedTags: ['Personal', 'Gym', 'Work'],
  };

  // Mock journal entries for demonstration
  const mockEntries = [
    {
      date: format(new Date(), 'yyyy-MM-dd'),
      content: 'Today was a great day!',
      mood: 'happy',
    },
    {
      date: format(
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      ),
      content: 'Feeling a bit down today.',
      mood: 'sad',
    },
    {
      date: format(
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      ),
      content: 'Made progress on my project!',
      mood: 'productive',
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    localStorage.removeItem('token');
    router.push('/login');
    return null;
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // In a real app, you would fetch entries for this date
    console.log('Selected date:', format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#003243] mb-6">
        My Journal Calendar
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col order-2 md:order-1">
          <JournalCalendar
            entries={mockEntries}
            onDateSelect={handleDateSelect}
          />
          <Analytics
            totalEntries={mockAnalyticsData.totalEntries}
            mostUsedTags={mockAnalyticsData.mostUsedTags}
          />
        </div>
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6 order-1 md:order-2">
          {selectedDate ? (
            <div>
              <h2 className="text-xl font-semibold text-[#003243] mb-4">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              <div className="space-y-4">
                {mockEntries
                  .filter(
                    (entry) => entry.date === format(selectedDate, 'yyyy-MM-dd')
                  )
                  .map((entry, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-[#01C269] pl-4 py-2"
                    >
                      <p className="text-gray-700">{entry.content}</p>
                      {entry.mood && (
                        <span className="inline-block mt-2 px-3 py-1 bg-[#01C26933] text-[#01C269] rounded-full text-sm">
                          {entry.mood}
                        </span>
                      )}
                    </div>
                  ))}
                {mockEntries.filter(
                  (entry) => entry.date === format(selectedDate, 'yyyy-MM-dd')
                ).length === 0 && (
                  <p className="text-gray-500">
                    No entries for this date. Create one?
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                Select a date to view or create entries
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
