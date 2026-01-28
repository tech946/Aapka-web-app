'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './dashboard.css';

interface Subscription {
  id: string;
  payment_status: string;
  is_active: boolean;
  end_date: string;
  amount_paid: number;
  currency: string;
  payment_transaction_id: string | null;
  payment_gateway: string | null;
  created_at: string;
}

interface Agent {
  id: string;
  email: string;
  full_name: string;
  resident_country: string;
  mobile_number: string;
  is_active: boolean;
  created_at: string;
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const supabase = createClientComponentClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push('/agent/login');
          return;
        }

        setUserEmail(session.user.email || '');

        // Fetch agent and subscription data
        const response = await fetch('/api/agent-subscription/dashboard', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();
        setAgent(data.agent);
        setSubscription(data.subscription);
      } catch (error: any) {
        console.error('Error loading dashboard:', error);
        toast.error('Failed to load dashboard. Please try again.');
        router.push('/agent/login');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleLogout = async () => {
    try {
      const supabase = createClientComponentClient();
      await supabase.auth.signOut();
      router.push('/agent/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className='agent-dashboard-page'>
        <div className='agent-dashboard-container'>
          <div className='loading-state'>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='agent-dashboard-page'>
      <div className='agent-dashboard-container'>
        <div className='agent-dashboard-header'>
          <div>
            <h1 className='dashboard-title'>Agent Dashboard</h1>
            <p className='dashboard-subtitle'>Welcome back, {agent?.full_name || 'Agent'}</p>
          </div>
          <button onClick={handleLogout} className='logout-button'>
            Logout
          </button>
        </div>

        <div className='dashboard-content'>
          {/* Agent Information Card */}
          <div className='dashboard-card'>
            <h2 className='card-title'>Agent Information</h2>
            <div className='info-grid'>
              <div className='info-item'>
                <label className='info-label'>Full Name</label>
                <p className='info-value'>{agent?.full_name || 'N/A'}</p>
              </div>
              <div className='info-item'>
                <label className='info-label'>Email</label>
                <p className='info-value'>{agent?.email || 'N/A'}</p>
              </div>
              <div className='info-item'>
                <label className='info-label'>Mobile Number</label>
                <p className='info-value'>{agent?.mobile_number || 'N/A'}</p>
              </div>
              <div className='info-item'>
                <label className='info-label'>Resident Country</label>
                <p className='info-value'>{agent?.resident_country || 'N/A'}</p>
              </div>
              <div className='info-item'>
                <label className='info-label'>Status</label>
                <p className={`info-value status ${agent?.is_active ? 'active' : 'inactive'}`}>
                  {agent?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className='info-item'>
                <label className='info-label'>Member Since</label>
                <p className='info-value'>
                  {agent?.created_at
                    ? format(new Date(agent.created_at), 'MMM dd, yyyy')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Information Card */}
          {subscription && (
            <div className='dashboard-card'>
              <h2 className='card-title'>Subscription Details</h2>
              <div className='info-grid'>
                <div className='info-item'>
                  <label className='info-label'>Subscription Status</label>
                  <p className={`info-value status ${subscription.is_active ? 'active' : 'inactive'}`}>
                    {subscription.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className='info-item'>
                  <label className='info-label'>Payment Status</label>
                  <p className={`info-value status ${subscription.payment_status === 'completed' ? 'active' : 'pending'}`}>
                    {subscription.payment_status === 'completed' ? 'Completed' : 'Pending'}
                  </p>
                </div>
                <div className='info-item'>
                  <label className='info-label'>Amount Paid</label>
                  <p className='info-value'>
                    {subscription.amount_paid} {subscription.currency}
                  </p>
                </div>
                <div className='info-item'>
                  <label className='info-label'>Expiry Date</label>
                  <p className='info-value'>
                    {format(new Date(subscription.end_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className='info-item'>
                  <label className='info-label'>Transaction ID</label>
                  <p className='info-value'>
                    {subscription.payment_transaction_id || 'N/A'}
                  </p>
                </div>
                <div className='info-item'>
                  <label className='info-label'>Payment Gateway</label>
                  <p className='info-value'>
                    {subscription.payment_gateway?.toUpperCase() || 'N/A'}
                  </p>
                </div>
                <div className='info-item'>
                  <label className='info-label'>Subscription Date</label>
                  <p className='info-value'>
                    {format(new Date(subscription.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Information Card */}
          {subscription && subscription.payment_status === 'completed' && (
            <div className='dashboard-card'>
              <h2 className='card-title'>Invoice Details</h2>
              <div className='invoice-details'>
                <div className='invoice-header'>
                  <div>
                    <p className='invoice-label'>Invoice Number</p>
                    <p className='invoice-value'>
                      INV-{subscription.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className='invoice-label'>Date</p>
                    <p className='invoice-value'>
                      {format(new Date(subscription.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className='invoice-body'>
                  <table className='invoice-table'>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Agent Premium Subscription (1 Year)</td>
                        <td>1</td>
                        <td>
                          {subscription.amount_paid} {subscription.currency}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className='invoice-total-label'>
                          Total
                        </td>
                        <td className='invoice-total-amount'>
                          {subscription.amount_paid} {subscription.currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className='invoice-footer'>
                  <p className='invoice-note'>
                    Payment Method: {subscription.payment_gateway?.toUpperCase() || 'N/A'}
                  </p>
                  <p className='invoice-note'>
                    Transaction ID: {subscription.payment_transaction_id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
