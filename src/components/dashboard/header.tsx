'use client';

import { TeamSelector } from './TeamSelector';
import { LogoutOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { EmailTemplatePreview } from './EmailTemplatePreview';

type Category = { id: string; name: string };

export function Header() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function loadCategories() {
      try {
        const res = await fetch('/api/package-categories?limit=100', {
          method: 'GET',
          signal: controller.signal,
        });
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && Array.isArray(json.data)) {
          setCategories(
            json.data.map((r: any) => ({ id: r.id, name: r.name }))
          );
        } else {
          setCategories([]);
        }
      } catch {
        if (active) setCategories([]);
      }
    }
    loadCategories();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleCategoryClick = (category: Category) => {
    const slug = toSlug(category.name);
    router.push(`/dashboard/package-categories/${slug}`);
    setShowDropdown(false);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear any local storage or cookies if needed
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login page
        router.push('/auth/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className='header'>
      <div className='header_left'>
        <TeamSelector />
      </div>
      <div className='header_right'>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            ref={buttonRef}
            className='btn btn_primary'
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Add Package
            <ChevronDown />
          </button>
          {showDropdown && categories.length > 0 && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto',
              }}
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--text)',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type='default'
          icon={<MailOutlined />}
          onClick={() => setShowEmailPreview(true)}
          style={{ marginLeft: '8px' }}
          title='Preview Email Templates'
        >
          Preview Emails
        </Button>
        <Button
          type='primary'
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ marginLeft: '8px' }}
        >
          Logout
        </Button>
      </div>
      <Modal
        open={showEmailPreview}
        onCancel={() => setShowEmailPreview(false)}
        footer={null}
        width='90%'
        style={{ maxWidth: '1200px' }}
        title='Email Template Preview'
      >
        <EmailTemplatePreview />
      </Modal>
    </div>
  );
}
