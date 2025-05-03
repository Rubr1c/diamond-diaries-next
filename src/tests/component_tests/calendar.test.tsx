/* eslint-disable react/display-name, @typescript-eslint/no-explicit-any */
/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalCalendar } from '@/components/custom/calendar';

jest.mock('react-calendar', () => (props: any) => {
  const { onChange, tileContent, selectRange } = props;
  return (
    <div>
      <button data-testid="calendar" onClick={() => onChange(new Date('2025-05-03'))}>
        Calendar
      </button>
      <div data-testid="tile-content">
        {tileContent({ date: new Date('2025-05-03'), view: 'month' })}
      </div>
      <span data-testid="select-range">{String(selectRange)}</span>
    </div>
  );
});

describe('JournalCalendar Component', () => {
  it('renders calendar and tileContent for entries', () => {
    render(<JournalCalendar entries={[{ date: '2025-05-03', content: '', mood: '' }]} />);
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    const tile = screen.getByTestId('tile-content').firstChild;
    expect(tile).toBeInstanceOf(HTMLDivElement);
  });

  it('calls onChange when date is clicked', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<JournalCalendar onChange={onChange} />);
    await user.click(screen.getByTestId('calendar'));
    expect(onChange).toHaveBeenCalledWith(new Date('2025-05-03'));
  });

  it('does not render marker for dates without entries', () => {
    render(<JournalCalendar entries={[]} />);
    expect(screen.getByTestId('tile-content').textContent).toBe('');
  });

  it('passes selectRange prop to Calendar', () => {
    render(<JournalCalendar selectRange={false} />);
    expect(screen.getByTestId('select-range').textContent).toBe('false');
  });
});