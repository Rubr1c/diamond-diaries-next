'use client';

import { Card } from './card';

interface AnalyticsProps {
  totalEntries: number;
  mostUsedTags: string[];
}

export function Analytics({
  totalEntries = 0,
  mostUsedTags = [],
}: AnalyticsProps) {
  return (
    <Card className="p-4 shadow-md bg-white mt-4">
      <h2 className="text-lg font-semibold text-[#003243] mb-4">
        Weekly Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Entries */}
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm text-gray-600 mb-1">
            Total Entries this week
          </h3>
          <p className="text-2xl font-bold text-[#003243]">{totalEntries}</p>
        </div>

        {/* Most Used Tags */}
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm text-gray-600 mb-1">Most used tags</h3>
          <ul className="text-sm">
            {mostUsedTags.map((tag, index) => (
              <li key={index} className="text-[#003243]">
                -{tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
