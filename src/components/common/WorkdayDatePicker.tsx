import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import 'react-day-picker/style.css';
import './WorkdayDatePicker.css';

interface WorkdayDatePickerProps {
  label: string;
  value: string;
  min?: string;
  required?: boolean;
  onChange: (value: string) => void;
  disabledDates?: string[];
  availableDates?: string[];
  availabilityLoading?: boolean;
  onMonthChange?: (month: Date) => void;
  footer?: string;
}

const parseLocalDate = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WorkdayDatePicker({
  label,
  value,
  min,
  required,
  onChange,
  disabledDates = [],
  availableDates,
  availabilityLoading = false,
  onMonthChange,
  footer = 'Ngày tiếp nhận phụ thuộc vào ca làm việc của kho gần nhất.',
}: WorkdayDatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => parseLocalDate(value), [value]);
  const minimum = useMemo(() => parseLocalDate(min), [min]);
  const disabledDateValues = useMemo(
    () => disabledDates.map(parseLocalDate).filter((date): date is Date => Boolean(date)),
    [disabledDates],
  );
  const availableDateSet = useMemo(() => new Set(availableDates || []), [availableDates]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="input-wrapper workday-picker" ref={rootRef}>
      <label className="input-label">
        {label}
        {required && !label.includes('*') ? ' *' : ''}
      </label>
      <button
        className="custom-input workday-picker-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span>{selected ? selected.toLocaleDateString('vi-VN') : 'Chọn ngày làm việc'}</span>
        <span>
          <CalendarDays size={18} />
          <ChevronDown size={15} />
        </span>
      </button>
      {open && (
        <div className="workday-picker-popover">
          <DayPicker
            mode="single"
            locale={vi}
            selected={selected}
            defaultMonth={selected || minimum}
            startMonth={minimum}
            disabled={[
              ...disabledDateValues,
              ...(minimum ? [{ before: minimum }] : []),
              ...(availableDates
                ? [(date: Date) => !availableDateSet.has(formatInputDate(date))]
                : []),
            ]}
            onMonthChange={onMonthChange}
            onSelect={(date) => {
              if (!date) return;
              onChange(formatInputDate(date));
              setOpen(false);
            }}
            footer={availabilityLoading ? 'Đang tải lịch ca của kho...' : footer}
          />
        </div>
      )}
    </div>
  );
}
