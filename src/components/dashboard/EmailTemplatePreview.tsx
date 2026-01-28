'use client';

import { useState } from 'react';
import { Tabs, Button, Spin } from 'antd';
import { MailOutlined, EyeOutlined } from '@ant-design/icons';

export function EmailTemplatePreview() {
  const [activeTab, setActiveTab] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [customerHtml, setCustomerHtml] = useState<string | null>(null);
  const [internalHtml, setInternalHtml] = useState<string | null>(null);

  // Sample booking data for preview
  const sampleBookingData = {
    bookingId: 'BK-2024-001234',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    customerPhone: '+971567809460',
    customerWhatsApp: '+971567809460',
    bookingDate: new Date().toISOString(),
    packages: [
      {
        packageName: 'Dubai City Tour',
        packageId: 'PKG-001',
        selectedDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        adults: 2,
        children: 1,
        infants: 0,
        price: 1500,
      },
      {
        packageName: 'Desert Safari Experience',
        packageId: 'PKG-002',
        selectedDate: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
        adults: 2,
        children: 1,
        infants: 0,
        price: 2000,
      },
    ],
    totalAmount: 3500,
    paymentAmount: 3500,
    paymentCurrency: 'AED',
    paymentType: 'full',
    paymentStatus: 'completed',
    paymentTransactionId: 'TXN-1234567890',
    paymentGateway: 'ccavenue',
    passengers: [
      {
        salutation: 'Mr',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+971567809460',
        whatsapp: '+971567809460',
        country: 'UAE',
        pickupLocation: 'Dubai Marina Hotel',
        permanentAddress: '123 Main Street, Dubai, UAE',
        passportExpiry: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        nationality: 'UAE',
      },
      {
        salutation: 'Mrs',
        firstName: 'Jane',
        lastName: 'Doe',
        email: '',
        phone: '',
        whatsapp: '',
        country: 'UAE',
        permanentAddress: '123 Main Street, Dubai, UAE',
        passportExpiry: new Date(
          Date.now() + 400 * 24 * 60 * 60 * 1000
        ).toISOString(),
        nationality: 'UAE',
      },
    ],
  };

  const loadTemplate = async (type: 'customer' | 'internal') => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data: sampleBookingData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (type === 'customer') {
          setCustomerHtml(result.html);
        } else {
          setInternalHtml(result.html);
        }
      } else {
        console.error('Failed to load template');
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'customer' && !customerHtml) {
      loadTemplate('customer');
    } else if (key === 'internal' && !internalHtml) {
      loadTemplate('internal');
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'customer',
            label: (
              <span>
                <MailOutlined /> Customer Email
              </span>
            ),
            children: (
              <div>
                {!customerHtml && (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Button
                      type='primary'
                      icon={<EyeOutlined />}
                      onClick={() => loadTemplate('customer')}
                      loading={loading}
                    >
                      Load Customer Template
                    </Button>
                  </div>
                )}
                {loading && customerHtml === null && (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size='large' />
                  </div>
                )}
                {customerHtml && (
                  <div
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      overflow: 'auto',
                      maxHeight: '70vh',
                      backgroundColor: '#f5f7fa',
                      padding: '20px',
                    }}
                  >
                    <iframe
                      srcDoc={customerHtml}
                      style={{
                        width: '100%',
                        minHeight: '600px',
                        border: 'none',
                        backgroundColor: '#ffffff',
                      }}
                      title='Customer Email Template'
                    />
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'internal',
            label: (
              <span>
                <MailOutlined /> Internal Email
              </span>
            ),
            children: (
              <div>
                {!internalHtml && (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Button
                      type='primary'
                      icon={<EyeOutlined />}
                      onClick={() => loadTemplate('internal')}
                      loading={loading}
                    >
                      Load Internal Template
                    </Button>
                  </div>
                )}
                {loading && internalHtml === null && (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size='large' />
                  </div>
                )}
                {internalHtml && (
                  <div
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      overflow: 'auto',
                      maxHeight: '70vh',
                      backgroundColor: '#f5f7fa',
                      padding: '20px',
                    }}
                  >
                    <iframe
                      srcDoc={internalHtml}
                      style={{
                        width: '100%',
                        minHeight: '600px',
                        border: 'none',
                        backgroundColor: '#ffffff',
                      }}
                      title='Internal Email Template'
                    />
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
