'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Typography, Space, Empty } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  lead_id?: string;
}

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationClick,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        '/api/notifications?limit=10&unread_only=false'
      );
      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(
          response.data.notifications?.filter((n: Notification) => !n.is_read)
            .length || 0
        );
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await axios.put('/api/notifications', {
        notification_ids: notificationIds,
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications', {
        mark_all_read: true,
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'timeline_update':
        return '📈';
      case 'lead_status_change':
        return '🔄';
      default:
        return '🔔';
    }
  };

  const notificationMenu = {
    items: [
      {
        key: 'header',
        label: (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
              marginBottom: '8px',
            }}
          >
            <Text strong>Notifications</Text>
            {unreadCount > 0 && (
              <Button
                type='link'
                size='small'
                onClick={markAllAsRead}
                style={{ padding: 0 }}
              >
                Mark all read
              </Button>
            )}
          </div>
        ),
        type: 'group' as const,
      },
      ...notifications.map(notification => ({
        key: notification.id,
        label: (
          <div
            style={{
              cursor: 'pointer',
              backgroundColor: notification.is_read ? 'transparent' : '#f6ffed',
              borderRadius: '4px',
              padding: '8px',
              margin: '4px 0',
            }}
            onClick={() => handleNotificationClick(notification)}
          >
            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
            >
              <span style={{ fontSize: '16px' }}>
                {getNotificationIcon(notification.type)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: notification.is_read ? 'normal' : 'bold',
                    marginBottom: '4px',
                    fontSize: '14px',
                  }}
                >
                  {notification.title}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px',
                    lineHeight: '1.4',
                  }}
                >
                  {notification.message}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#999',
                  }}
                >
                  {dayjs(notification.created_at).fromNow()}
                </div>
              </div>
              {!notification.is_read && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#1890ff',
                    flexShrink: 0,
                    marginTop: '4px',
                  }}
                />
              )}
            </div>
          </div>
        ),
      })),
      ...(notifications.length === 0
        ? [
            {
              key: 'empty',
              label: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description='No notifications'
                  style={{ padding: '20px 0' }}
                />
              ),
            },
          ]
        : []),
    ],
  };

  return (
    <Dropdown
      menu={notificationMenu}
      trigger={['click']}
      placement='bottomRight'
      overlayStyle={{ width: '350px', maxHeight: '400px' }}
    >
      <Badge count={unreadCount} size='small'>
        <Button
          type='text'
          icon={<BellOutlined />}
          size='large'
          loading={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
          }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
