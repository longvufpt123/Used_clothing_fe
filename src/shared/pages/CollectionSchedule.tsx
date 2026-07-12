import React, { useState, useEffect } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { useToast } from '@/context/ToastContext';
import Tooltip from '@/components/common/Tooltip';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Clock, 
  MapPin, 
  List, 
  Sparkle, 
  Check, 
  X, 
  SlidersHorizontal,
  PlusCircle
} from 'lucide-react';
import './CollectionSchedule.css';

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  time: string;
  durationMinutes: number;
  location?: string;
  organizer?: string;
  description?: string;
  status: 'assigned' | 'picking' | 'completed';
  driver?: string;
  weight?: string;
}

const INITIAL_EVENTS: CalendarEvent[] = [
  { 
    id: 1,
    date: new Date(2026, 6, 6), 
    time: "08:15 AM", 
    durationMinutes: 90,
    title: "Ca Sáng - Tuyến Quận 3 (Hoàng)",
    location: "789 CMT8, Quận 3, TP. HCM",
    organizer: "Hà Thu",
    description: "Đơn thu gom RT-2026-803. Người gửi: Trần Minh Cường. Liên hệ: 0912345678. Gom quần áo trẻ em cũ.",
    status: 'assigned',
    driver: 'Nguyễn Văn Hoàng',
    weight: 'Dưới 5 kg'
  },
  { 
    id: 2,
    date: new Date(2026, 6, 7), 
    time: "10:30 AM", 
    durationMinutes: 120,
    title: "Ca Trưa - Gom Quận 1 (Hoàng)",
    location: "12 Lê Văn Sỹ, Quận 1, TP. HCM",
    organizer: "Hà Thu",
    description: "Đơn thu gom RT-2026-805. Người gửi: Nguyễn Bích Phương. Liên hệ: 0933445566. Gom kiện hàng nặng.",
    status: 'picking',
    driver: 'Nguyễn Văn Hoàng',
    weight: '10-20 kg'
  },
  { 
    id: 3,
    date: new Date(2026, 6, 9), 
    time: "02:00 PM", 
    durationMinutes: 60,
    title: "Ca Chiều - Gom Bình Thạnh (Tấn)",
    location: "345 Điện Biên Phủ, TP. HCM",
    organizer: "Hà Thu",
    description: "Đơn thu gom RT-2026-806. Người gửi: Đặng Tuấn Anh. Liên hệ: 0909887766. Gom quần áo nam thu đông.",
    status: 'completed',
    driver: 'Trần Minh Tấn',
    weight: '5-10 kg'
  },
  { 
    id: 4,
    date: new Date(2026, 6, 10), 
    time: "09:00 AM", 
    durationMinutes: 90,
    title: "Ca Sáng - Gom Tân Bình (Tấn)",
    location: "Phòng 402, Chung cư Bàu Cát, Tân Bình",
    organizer: "Hà Thu",
    description: "Nhận gom quần áo ấm quyên góp vùng cao. SĐT: 0945678123.",
    status: 'assigned',
    driver: 'Trần Minh Tấn',
    weight: '10-20 kg'
  }
];

const HOURS = Array.from({ length: 24 }).map((_, i) => {
  if (i === 0) return "12 AM";
  if (i < 12) return `${i} AM`;
  if (i === 12) return "12 PM";
  return `${i - 12} PM`;
});

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

type CalendarViewType = "day" | "workweek" | "week" | "month";

export const CollectionSchedule: React.FC = () => {
  const toast = useToast();
  
  // Date states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 6)); // July 6, 2026
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 6, 1));
  const [currentView, setCurrentView] = useState<CalendarViewType>("month");
  
  // Events state
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerViewMode, setPickerViewMode] = useState<'month' | 'year'>('month');
  const [pickerActiveYear, setPickerActiveYear] = useState<number>(2026);
  const [activePopoverEvent, setActivePopoverEvent] = useState<CalendarEvent | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // Inline Quick Add State
  const [inlineAddDate, setInlineAddDate] = useState<Date | null>(null);
  const [inlineAddWeekDate, setInlineAddWeekDate] = useState<Date | null>(null);
  const [inlineAddWeekMinutes, setInlineAddWeekMinutes] = useState<number | null>(null);
  const [inlineAddTitle, setInlineAddTitle] = useState("");

  // Filters State
  const [filters, setFilters] = useState({
    assigned: true,
    picking: true,
    completed: true,
  });

  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(
    new Date().getHours() * 60 + new Date().getMinutes()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync currentMonth state when selectedDate changes
  useEffect(() => {
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setPickerActiveYear(selectedDate.getFullYear());
  }, [selectedDate]);

  // Helper: check same day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  // Month Grid Calculation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  const monthGridDays: { date: Date; isCurrentMonth: boolean }[] = [];

  // Prev Month Days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    monthGridDays.push({
      date: new Date(year, month - 1, prevLastDate - i),
      isCurrentMonth: false
    });
  }
  // Current Month Days
  for (let i = 1; i <= lastDate; i++) {
    monthGridDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  // Next Month Days
  const currentTotal = monthGridDays.length;
  const gridRows = currentTotal > 35 ? 6 : 5;
  const targetSlots = gridRows * 7;
  const nextDaysCount = targetSlots - currentTotal;
  for (let i = 1; i <= nextDaysCount; i++) {
    monthGridDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  // Week Grid Calculation
  const getSunday = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (baseDate: Date) => {
    const sun = getSunday(baseDate);
    const result: Date[] = [];
    if (currentView === "workweek") {
      // Mon - Fri
      for (let i = 1; i <= 5; i++) {
        const next = new Date(sun);
        next.setDate(sun.getDate() + i);
        result.push(next);
      }
    } else if (currentView === "day") {
      result.push(new Date(baseDate));
    } else {
      // Sun - Sat
      for (let i = 0; i <= 6; i++) {
        const next = new Date(sun);
        next.setDate(sun.getDate() + i);
        result.push(next);
      }
    }
    return result;
  };

  const activeWeekDays = getWeekDays(selectedDate);

  const getHeaderTitle = () => {
    if (currentView === "month") {
      return `${MONTH_NAMES[month]} ${year}`;
    }
    if (currentView === "day") {
      return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
    }
    const start = activeWeekDays[0];
    const end = activeWeekDays[activeWeekDays.length - 1];
    
    if (start.getFullYear() !== end.getFullYear()) {
      return `${MONTH_NAMES[start.getMonth()].substring(0, 3)} ${start.getDate()}, ${start.getFullYear()} – ${MONTH_NAMES[end.getMonth()].substring(0, 3)} ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (start.getMonth() !== end.getMonth()) {
      return `${MONTH_NAMES[start.getMonth()].substring(0, 3)} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()].substring(0, 3)} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  };

  // Navigations
  const handlePrev = () => {
    if (currentView === "month") {
      setCurrentMonth(new Date(year, month - 1, 1));
    } else if (currentView === "week" || currentView === "workweek") {
      const prevWeek = new Date(selectedDate);
      prevWeek.setDate(selectedDate.getDate() - 7);
      setSelectedDate(prevWeek);
    } else {
      const prevDay = new Date(selectedDate);
      prevDay.setDate(selectedDate.getDate() - 1);
      setSelectedDate(prevDay);
    }
  };

  const handleNext = () => {
    if (currentView === "month") {
      setCurrentMonth(new Date(year, month + 1, 1));
    } else if (currentView === "week" || currentView === "workweek") {
      const nextWeek = new Date(selectedDate);
      nextWeek.setDate(selectedDate.getDate() + 7);
      setSelectedDate(nextWeek);
    } else {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      setSelectedDate(nextDay);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Event Clicks / Details Popover
  const handleEventCardClick = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    let leftPos = rect.left + rect.width + 10;
    if (rect.left + rect.width + 420 > window.innerWidth) {
      leftPos = rect.left - 420;
    }
    setPopoverPosition({
      top: rect.top - 20,
      left: Math.max(10, leftPos),
    });
    setActivePopoverEvent(evt);
  };

  // Inline Quick Add handlers
  const handleSaveInlineEvent = (date: Date) => {
    if (inlineAddTitle.trim()) {
      const newEvt: CalendarEvent = {
        id: Date.now(),
        title: inlineAddTitle.trim(),
        date: date,
        time: "09:00 AM",
        durationMinutes: 60,
        status: 'assigned',
        organizer: "Hà Thu",
        description: "Lịch trực thu gom nhanh được tạo từ giao diện Lịch."
      };
      setEvents(prev => [...prev, newEvt]);
      toast.success(`Đã tạo nhanh ca trực: "${inlineAddTitle}"`);
    }
    setInlineAddDate(null);
    setInlineAddTitle("");
  };

  const handleSaveInlineWeekEvent = (date: Date, minutes: number) => {
    if (inlineAddTitle.trim()) {
      const hour24 = Math.floor(minutes / 60);
      const min = minutes % 60;
      const ampm = hour24 >= 12 ? "PM" : "AM";
      const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const minStr = min < 10 ? `0${min}` : min;
      const timeStr = `${displayHour < 10 ? '0' + displayHour : displayHour}:${minStr} ${ampm}`;

      const newEvt: CalendarEvent = {
        id: Date.now(),
        title: inlineAddTitle.trim(),
        date: date,
        time: timeStr,
        durationMinutes: 60,
        status: 'assigned',
        organizer: "Hà Thu",
        description: "Lịch trực thu gom nhanh được tạo từ giao diện Lưới giờ."
      };
      setEvents(prev => [...prev, newEvt]);
      toast.success(`Đã tạo nhanh ca trực: "${inlineAddTitle}" lúc ${timeStr}`);
    }
    setInlineAddWeekDate(null);
    setInlineAddWeekMinutes(null);
    setInlineAddTitle("");
  };

  const handleGridColumnClick = (e: React.MouseEvent, date: Date) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const minutes = Math.min(23 * 60 + 30, Math.max(0, Math.floor(clickY / 40) * 30));
    setInlineAddWeekDate(date);
    setInlineAddWeekMinutes(minutes);
    setInlineAddTitle("");
  };

  const parseEventTime = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { hour: 8, minute: 0, totalMinutes: 480 };
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return { hour, minute, totalMinutes: hour * 60 + minute };
  };

  // RSVP Actions for Popover
  const handleAcceptRsvp = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'picking' } : e));
    toast.success("Đã xác nhận NHẬN ca trực thu gom này!");
    setActivePopoverEvent(null);
  };

  const handleDeclineRsvp = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'assigned' } : e));
    toast.info("Đã từ chối hoặc hủy nhận ca trực.");
    setActivePopoverEvent(null);
  };

  const handleCompleteRsvp = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'completed' } : e));
    toast.success("Đã xác nhận HOÀN THÀNH ca trực thu gom!");
    setActivePopoverEvent(null);
  };

  // MiniCalendar logic
  const miniMonth = currentMonth.getMonth();
  const miniYear = currentMonth.getFullYear();
  const miniFirstDayIdx = new Date(miniYear, miniMonth, 1).getDay();
  const miniLastDate = new Date(miniYear, miniMonth + 1, 0).getDate();
  const miniPrevLastDate = new Date(miniYear, miniMonth, 0).getDate();

  const miniDays: Date[] = [];
  for (let i = miniFirstDayIdx - 1; i >= 0; i--) {
    miniDays.push(new Date(miniYear, miniMonth - 1, miniPrevLastDate - i));
  }
  for (let i = 1; i <= miniLastDate; i++) {
    miniDays.push(new Date(miniYear, miniMonth, i));
  }
  const totalMiniSlots = 42;
  const miniNextCount = totalMiniSlots - miniDays.length;
  for (let i = 1; i <= miniNextCount; i++) {
    miniDays.push(new Date(miniYear, miniMonth + 1, i));
  }

  // Filtered Events
  const filteredEvents = events.filter(e => {
    if (e.status === 'assigned' && !filters.assigned) return false;
    if (e.status === 'picking' && !filters.picking) return false;
    if (e.status === 'completed' && !filters.completed) return false;
    return true;
  });

  return (
    <AdminLayout role="manager">
      <div className="collection-schedule-page">

        {/* Calendar layout */}
        <div className="calendar-layout-container">
          
          {/* Sidebar */}
          <div className="calendar-sidebar-wrapper">
            
            {/* Quick add button */}
            <button className="sidebar-quick-add-btn" onClick={() => {
              setInlineAddDate(new Date(selectedDate));
              setInlineAddTitle("");
            }}>
              <PlusCircle size={16} />
              <span>Tạo nhanh ca trực</span>
            </button>

            {/* Mini Calendar */}
            <div className="mini-calendar-container">
              <div className="mini-cal-header">
                <span className="mini-cal-title">
                  {MONTH_NAMES[miniMonth]} {miniYear}
                </span>
                <div className="mini-cal-navs">
                  <button className="mini-cal-btn" onClick={() => setCurrentMonth(new Date(miniYear, miniMonth - 1, 1))}>
                    <ChevronLeft size={14} />
                  </button>
                  <button className="mini-cal-btn" onClick={() => setCurrentMonth(new Date(miniYear, miniMonth + 1, 1))}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              <div className="mini-cal-grid">
                {WEEKDAY_SHORT.map((w, idx) => (
                  <span key={idx} className="mini-cal-weekday">{w}</span>
                ))}
                {miniDays.map((d, idx) => {
                  const isSel = isSameDay(d, selectedDate);
                  const isCurr = d.getMonth() === miniMonth;
                  const isTday = isToday(d);
                  return (
                    <button 
                      key={idx} 
                      className={`mini-cal-day-btn ${!isCurr ? 'outside-day' : ''} ${isSel ? 'selected' : ''} ${isTday ? 'today' : ''}`}
                      onClick={() => {
                        setSelectedDate(d);
                      }}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter controls */}
            <div className="sidebar-filters-section">
              <div className="filter-section-title">
                <SlidersHorizontal size={14} />
                <span>Trạng thái ca trực</span>
              </div>
              <div className="filter-options-list">
                <label className="filter-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    checked={filters.assigned} 
                    onChange={() => setFilters(p => ({ ...p, assigned: !p.assigned }))} 
                  />
                  <span className="custom-chk-box assigned-chk" />
                  <span>Đã phân công (Chờ nhận)</span>
                </label>
                <label className="filter-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    checked={filters.picking} 
                    onChange={() => setFilters(p => ({ ...p, picking: !p.picking }))} 
                  />
                  <span className="custom-chk-box picking-chk" />
                  <span>Đang đi thu gom</span>
                </label>
                <label className="filter-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    checked={filters.completed} 
                    onChange={() => setFilters(p => ({ ...p, completed: !p.completed }))} 
                  />
                  <span className="custom-chk-box completed-chk" />
                  <span>Đã hoàn thành</span>
                </label>
              </div>
            </div>

            {/* Task list for selected date */}
            <div className="sidebar-tasks-for-day">
              <div className="filter-section-title" style={{ marginBottom: '8px' }}>
                <CalendarIcon size={14} />
                <span>Ca trực ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}</span>
              </div>
              <div className="day-tasks-list">
                {events.filter(e => isSameDay(e.date, selectedDate)).length === 0 ? (
                  <p className="no-tasks-text" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0' }}>Không có ca trực nào.</p>
                ) : (
                  events
                    .filter(e => isSameDay(e.date, selectedDate))
                    .map(evt => {
                      const tooltipContent = `${evt.title} | Thời gian: ${evt.time} | Địa điểm: ${evt.location || 'Chưa có'} | Tài xế: ${evt.driver || 'Chưa phân công'}`;
                      return (
                        <Tooltip key={evt.id} content={tooltipContent} position="top">
                          <div 
                            className={`day-task-item status-${evt.status}`}
                            onClick={(e) => handleEventCardClick(e, evt)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              padding: '6px 8px', 
                              borderRadius: 'var(--radius-sm)', 
                              cursor: 'pointer',
                              marginBottom: '6px',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <span className={`status-indicator-dot dot-${evt.status}`} style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: evt.status === 'assigned' ? '#f59e0b' : evt.status === 'picking' ? '#3b82f6' : '#10b981',
                              flexShrink: 0
                            }} />
                            <div className="day-task-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                              <span className="day-task-time" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{evt.time}</span>
                              <span className="day-task-title" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</span>
                            </div>
                          </div>
                        </Tooltip>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* Main Grid View */}
          <div className="calendar-grid-wrapper">
            
            {/* Toolbar */}
            <div className="calendar-toolbar-header">
              <div className="toolbar-left-group">
                <button className="btn-today-nav" onClick={handleToday}>
                  <CalendarIcon size={14} />
                  <span>Hôm nay</span>
                </button>
                <div className="nav-arrow-buttons">
                  <button className="nav-arrow-btn" onClick={handlePrev}>
                    <ChevronLeft size={16} />
                  </button>
                  <button className="nav-arrow-btn" onClick={handleNext}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="toolbar-current-title" style={{ position: 'relative' }}>
                  <div className="title-trigger-flex" onClick={() => { setIsMonthPickerOpen(!isMonthPickerOpen); setPickerViewMode('month'); setPickerActiveYear(selectedDate.getFullYear()); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <h3>{getHeaderTitle()}</h3>
                    <ChevronDown size={14} />
                  </div>
                  {isMonthPickerOpen && (
                    <>
                      <div className="popover-backdrop" onClick={(e) => { e.stopPropagation(); setIsMonthPickerOpen(false); }} />
                      <div className="month-year-picker-dropdown" onClick={(e) => e.stopPropagation()}>
                        {pickerViewMode === 'month' ? (
                          <>
                            <div className="picker-header">
                              <button type="button" className="picker-nav-btn" onClick={() => setPickerActiveYear(p => p - 1)}>
                                &laquo;
                              </button>
                              <span 
                                className="picker-year-label clickable" 
                                onClick={() => setPickerViewMode('year')}
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                title="Bấm để chọn năm"
                              >
                                {pickerActiveYear}
                              </span>
                              <button type="button" className="picker-nav-btn" onClick={() => setPickerActiveYear(p => p + 1)}>
                                &raquo;
                              </button>
                            </div>
                            <div className="picker-months-grid">
                              {["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"].map((m, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`picker-month-btn ${selectedDate.getMonth() === idx && selectedDate.getFullYear() === pickerActiveYear ? 'active' : ''}`}
                                  onClick={() => {
                                    const newDate = new Date(selectedDate);
                                    newDate.setFullYear(pickerActiveYear);
                                    newDate.setMonth(idx);
                                    setSelectedDate(newDate);
                                    setIsMonthPickerOpen(false);
                                  }}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="picker-header">
                              <button type="button" className="picker-nav-btn" onClick={() => setPickerActiveYear(p => p - 12)}>
                                &laquo;
                              </button>
                              <span 
                                className="picker-year-label clickable" 
                                onClick={() => setPickerViewMode('month')}
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                {pickerActiveYear - (pickerActiveYear % 12)} - {pickerActiveYear - (pickerActiveYear % 12) + 11}
                              </span>
                              <button type="button" className="picker-nav-btn" onClick={() => setPickerActiveYear(p => p + 12)}>
                                &raquo;
                              </button>
                            </div>
                            <div className="picker-months-grid years-grid">
                              {Array.from({ length: 12 }).map((_, i) => {
                                const startYear = pickerActiveYear - (pickerActiveYear % 12);
                                const y = startYear + i;
                                return (
                                  <button
                                    key={y}
                                    type="button"
                                    className={`picker-month-btn ${selectedDate.getFullYear() === y ? 'active' : ''}`}
                                    onClick={() => {
                                      setPickerActiveYear(y);
                                      setPickerViewMode('month');
                                    }}
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    {y}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="toolbar-right-group">
                <div className="view-switch-buttons">
                  {(["day", "workweek", "week", "month"] as const).map((view) => (
                    <button
                      key={view}
                      className={`view-switch-btn ${currentView === view ? 'active' : ''}`}
                      onClick={() => setCurrentView(view)}
                    >
                      {view === 'month' && 'Tháng'}
                      {view === 'week' && 'Tuần'}
                      {view === 'workweek' && 'Tuần làm việc'}
                      {view === 'day' && 'Ngày'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Month View Grid */}
            {currentView === "month" && (
              <div className="month-grid-view">
                <div className="weekdays-labels-header">
                  {WEEKDAY_NAMES.map((day, idx) => (
                    <div key={idx} className="weekday-label-cell">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="month-grid-body-scroll">
                  {Array.from({ length: gridRows }).map((_, weekIdx) => (
                    <div key={weekIdx} className="month-week-row-grid">
                      {monthGridDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((dayItem, dayIdx) => {
                        const date = dayItem.date;
                        const isSel = isSameDay(date, selectedDate);
                        const isTday = isToday(date);
                        const dayEvents = filteredEvents.filter(e => isSameDay(e.date, date));
                        
                        let dateLabel = `${date.getDate()}`;
                        if (date.getDate() === 1 || (weekIdx === 0 && dayIdx === 0)) {
                          dateLabel = `${MONTH_NAMES[date.getMonth()].substring(0, 3)} ${date.getDate()}`;
                        }

                        return (
                          <div 
                            key={dayIdx}
                            className={`month-day-cell ${isSel ? 'selected-cell' : ''} ${!dayItem.isCurrentMonth ? 'outside-month-cell' : ''}`}
                            onClick={(e) => {
                              setSelectedDate(date);
                              if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('events-cell-container')) {
                                setInlineAddDate(date);
                                setInlineAddTitle("");
                              }
                            }}
                          >
                            <div className="day-cell-top-bar">
                              <span className={`day-cell-number ${isTday ? 'today-badge' : ''}`}>
                                {dateLabel}
                              </span>
                              <button className="day-cell-quick-add-btn" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(date);
                                setInlineAddDate(date);
                                setInlineAddTitle("");
                              }}>
                                <Plus size={10} />
                              </button>
                            </div>

                            <div className="events-cell-container">
                              {dayEvents.map((evt) => (
                                <div 
                                  key={evt.id}
                                  className={`month-event-card-item status-${evt.status}`}
                                  onClick={(e) => handleEventCardClick(e, evt)}
                                >
                                  <span className="evt-time-prefix">{evt.time.split(' ')[0]}</span>
                                  <span className="evt-title-text">{evt.title}</span>
                                </div>
                              ))}

                              {/* Inline Quick Add Field */}
                              {inlineAddDate && isSameDay(inlineAddDate, date) && (
                                <div className="inline-add-input-box" onClick={e => e.stopPropagation()}>
                                  <input 
                                    type="text"
                                    value={inlineAddTitle}
                                    onChange={e => setInlineAddTitle(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveInlineEvent(date);
                                      if (e.key === 'Escape') setInlineAddDate(null);
                                    }}
                                    onBlur={() => handleSaveInlineEvent(date)}
                                    autoFocus
                                    placeholder="Tên ca trực..."
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Grid View (Week / Workweek / Day) */}
            {currentView !== "month" && (
              <div className="time-grid-view">
                
                {/* Column Headers */}
                <div className="time-grid-columns-header">
                  <div className="time-label-header-spacer" />
                  <div className="time-header-days-columns">
                    {activeWeekDays.map((date, idx) => {
                      const isSel = isSameDay(date, selectedDate);
                      const isTday = isToday(date);
                      return (
                        <div 
                          key={idx}
                          className={`time-header-day-cell ${isSel ? 'selected' : ''} ${isTday ? 'today' : ''}`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <div className="time-header-date-box">
                            <span className="header-day-num">{date.getDate()}</span>
                            <span className="header-day-name">{WEEKDAY_NAMES[date.getDay()]}</span>
                          </div>
                          {isSel && (
                            <button className="time-header-quick-add" onClick={(e) => {
                              e.stopPropagation();
                              setInlineAddWeekDate(date);
                              setInlineAddWeekMinutes(480); // Default 8:00 AM
                              setInlineAddTitle("");
                            }}>
                              <Plus size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scrollable time area */}
                <div className="time-grid-scroll-body">
                  <div className="time-labels-left-col">
                    {HOURS.map((hr, idx) => (
                      <div key={idx} className="time-hour-label-row">
                        {idx !== 0 && <span>{hr}</span>}
                      </div>
                    ))}
                  </div>

                  <div className="time-grid-columns-right-wrapper">
                    {/* Background grid lines */}
                    <div className="time-grid-bg-lines-container">
                      {HOURS.map((_, idx) => (
                        <div key={idx} className="bg-grid-hour-row">
                          <div className="half-hour-line-split" />
                        </div>
                      ))}
                    </div>

                    {/* Columns representing days */}
                    <div className="time-grid-day-columns">
                      {activeWeekDays.map((dayDate, colIdx) => {
                        const dayEvts = filteredEvents.filter(e => isSameDay(e.date, dayDate));
                        const isTday = isToday(dayDate);

                        return (
                          <div 
                            key={colIdx}
                            className="time-grid-day-column"
                            onClick={(e) => handleGridColumnClick(e, dayDate)}
                          >
                            {/* Render Events */}
                            {dayEvts.map((evt) => {
                              const { totalMinutes } = parseEventTime(evt.time);
                              const topPx = (totalMinutes / 60) * 40; // 40px per hour
                              const heightPx = (evt.durationMinutes / 60) * 40;

                              return (
                                <div 
                                  key={evt.id}
                                  className={`time-event-card-item status-${evt.status}`}
                                  style={{
                                    top: `${topPx}px`,
                                    height: `${heightPx}px`
                                  }}
                                  onClick={(e) => handleEventCardClick(e, evt)}
                                >
                                  <div className="time-card-duration">{evt.time}</div>
                                  <div className="time-card-title">{evt.title}</div>
                                </div>
                              );
                            })}

                            {/* Inline Week Add Card */}
                            {inlineAddWeekDate && isSameDay(inlineAddWeekDate, dayDate) && inlineAddWeekMinutes !== null && (
                              <div 
                                className="inline-week-add-card"
                                style={{
                                  top: `${(inlineAddWeekMinutes / 60) * 40}px`,
                                  height: '40px'
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <input 
                                  type="text"
                                  value={inlineAddTitle}
                                  onChange={e => setInlineAddTitle(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveInlineWeekEvent(dayDate, inlineAddWeekMinutes);
                                    if (e.key === 'Escape') {
                                      setInlineAddWeekDate(null);
                                      setInlineAddWeekMinutes(null);
                                    }
                                  }}
                                  onBlur={() => handleSaveInlineWeekEvent(dayDate, inlineAddWeekMinutes)}
                                  autoFocus
                                  placeholder="Nhập tên..."
                                />
                              </div>
                            )}

                            {/* Real-time indicator line */}
                            {isTday && (
                              <div 
                                className="currentTimeIndicator-line"
                                style={{ top: `${(currentTimeMinutes / 60) * 40}px` }}
                              >
                                <div className="currentTimeIndicator-dot" />
                                <div className="currentTimeIndicator-bar" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Event Details Popover */}
        {activePopoverEvent && (
          <>
            <div className="popover-backdrop" onClick={() => setActivePopoverEvent(null)} />
            <div 
              className="popover-details-card"
              style={{
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`
              }}
            >
              <div className="popover-card-header">
                <div className="popover-title-info">
                  <span className="popover-event-status-tag">{activePopoverEvent.status.toUpperCase()}</span>
                  <h3 className="popover-event-title">{activePopoverEvent.title}</h3>
                </div>
                <button className="popover-close-btn" onClick={() => setActivePopoverEvent(null)}>&times;</button>
              </div>

              <div className="popover-card-body-rows">
                <div className="popover-body-row">
                  <Clock size={16} />
                  <div>
                    <span>{activePopoverEvent.date.toDateString()}</span>
                    <span className="popover-body-row-sub"> • {activePopoverEvent.time} ({activePopoverEvent.durationMinutes} phút)</span>
                  </div>
                </div>

                {activePopoverEvent.location && (
                  <div className="popover-body-row">
                    <MapPin size={16} />
                    <span>{activePopoverEvent.location}</span>
                  </div>
                )}

                <div className="popover-body-row">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt={activePopoverEvent.organizer}
                    className="popover-organizer-avatar"
                  />
                  <div>
                    <span>Điều phối bởi <strong>{activePopoverEvent.organizer}</strong></span>
                    {activePopoverEvent.driver && (
                      <span className="popover-body-row-sub"> • Tài xế: {activePopoverEvent.driver}</span>
                    )}
                  </div>
                </div>

                {activePopoverEvent.description && (
                  <div className="popover-body-row align-start">
                    <List size={16} style={{ marginTop: '2px' }} />
                    <p className="popover-desc-paragraph">{activePopoverEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Actions/RSVP Row */}
              <div className="popover-rsvp-actions-footer">
                <span className="footer-action-label">Xác nhận ca trực:</span>
                <div className="footer-action-btns-group">
                  {activePopoverEvent.status === 'assigned' && (
                    <button 
                      className="popover-rsvp-btn accept-btn" 
                      onClick={() => handleAcceptRsvp(activePopoverEvent.id)}
                    >
                      <Check size={14} />
                      <span>Nhận ca này</span>
                    </button>
                  )}
                  {activePopoverEvent.status === 'picking' && (
                    <>
                      <button 
                        className="popover-rsvp-btn complete-btn" 
                        onClick={() => handleCompleteRsvp(activePopoverEvent.id)}
                      >
                        <Check size={14} />
                        <span>Hoàn thành ca</span>
                      </button>
                      <button 
                        className="popover-rsvp-btn decline-btn" 
                        onClick={() => handleDeclineRsvp(activePopoverEvent.id)}
                      >
                        <X size={14} />
                        <span>Hủy nhận ca</span>
                      </button>
                    </>
                  )}
                  {activePopoverEvent.status === 'completed' && (
                    <span className="completed-state-badge">✓ Đã hoàn thành thu gom</span>
                  )}
                </div>
              </div>

              {/* Copilot Suggestions */}
              <div className="popover-copilot-suggestions">
                <div className="copilot-panel-title">
                  <Sparkle size={14} className="sparkle-copilot-icon" />
                  <span>Gemini AI trợ lý lịch trình</span>
                </div>
                <div className="copilot-pill-options">
                  <button className="copilot-pill-btn" onClick={() => toast.info("Gemini: Tuyến đường CMT8 đang kẹt xe nhẹ, đề xuất đi đường Lê Văn Sỹ.")}>
                    Tối ưu lộ trình đi?
                  </button>
                  <button className="copilot-pill-btn" onClick={() => toast.info("Gemini: Tài xế Tấn trống lịch từ 10h-12h cùng khu vực.")}>
                    Đề xuất đổi tài xế?
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default CollectionSchedule;
