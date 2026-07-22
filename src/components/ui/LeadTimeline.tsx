'use client';

import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import './LeadTimeline.css';

interface TimelineStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  date?: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface LeadTimelineProps {
  currentStatus: string;
  timelineDates?: Record<string, string>;
  isEditable?: boolean;
  onStatusChange?: (status: string) => void;
}

const LeadTimeline: React.FC<LeadTimelineProps> = ({
  currentStatus,
  timelineDates = {},
  isEditable = false,
  onStatusChange,
}) => {
  const timelineSteps: TimelineStep[] = [
    {
      id: 'lead_submitted',
      title: 'Lead Submitted',
      icon: <div className='timeline-icon purple'>📋</div>,
      color: '#8B5CF6',
      date: timelineDates.lead_submitted,
      isActive: currentStatus === 'lead_submitted',
      isCompleted: [
        'call_scheduled',
        'site_visit_done',
        'booking_confirm',
        'commission_released',
      ].includes(currentStatus),
    },
    {
      id: 'call_scheduled',
      title: 'Call Scheduled',
      icon: <div className='timeline-icon green'>📞</div>,
      color: '#10B981',
      date: timelineDates.call_scheduled,
      isActive: currentStatus === 'call_scheduled',
      isCompleted: [
        'site_visit_done',
        'booking_confirm',
        'commission_released',
      ].includes(currentStatus),
    },
    {
      id: 'site_visit_done',
      title: 'Site Visit Done',
      icon: <div className='timeline-icon blue'>📍</div>,
      color: '#3B82F6',
      date: timelineDates.site_visit_done,
      isActive: currentStatus === 'site_visit_done',
      isCompleted: ['booking_confirm', 'commission_released'].includes(
        currentStatus
      ),
    },
    {
      id: 'booking_confirm',
      title: 'Booking Confirm',
      icon: <div className='timeline-icon green'>✅</div>,
      color: '#10B981',
      date: timelineDates.booking_confirm,
      isActive: currentStatus === 'booking_confirm',
      isCompleted: ['commission_released'].includes(currentStatus),
    },
    {
      id: 'commission_released',
      title: 'Commission Released',
      icon: <div className='timeline-icon red'>₹</div>,
      color: '#EF4444',
      date: timelineDates.commission_released,
      isActive: currentStatus === 'commission_released',
      isCompleted: false,
    },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const handleStepClick = (step: TimelineStep) => {
    if (isEditable && onStatusChange) {
      onStatusChange(step.id);
    }
  };

  return (
    <div className='lead-timeline'>
      {timelineSteps.map((step, index) => (
        <div
          key={step.id}
          className={`timeline-item ${step.isCompleted ? 'completed' : ''} ${
            step.isActive ? 'active' : ''
          } ${isEditable ? 'editable' : ''}`}
          onClick={() => handleStepClick(step)}
        >
          <div className='timeline-content'>
            <div className='timeline-icon-container'>{step.icon}</div>
            <div className='timeline-text'>
              <div className='timeline-title'>{step.title}</div>
              {step.date && (
                <div className='timeline-date'>
                  <CalendarOutlined className='calendar-icon' />
                  {formatDate(step.date)}
                </div>
              )}
            </div>
          </div>
          {index < timelineSteps.length - 1 && (
            <div className='timeline-connector' />
          )}
        </div>
      ))}
    </div>
  );
};

export default LeadTimeline;
