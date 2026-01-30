'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Wallet, TrendingUp } from 'lucide-react';
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
  document_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

type TabType = 'invoice' | 'personal' | 'bookings' | 'commissions';

export default function AgentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('invoice');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [commissions, setCommissions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<{
    available: number;
    pending: number;
    total: number;
  }>({ available: 0, pending: 0, total: 0 });
  const [loadingCommissions, setLoadingCommissions] = useState(false);

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
        
        // Load commissions and wallet if agent exists
        // Use agentId from response or agent.id
        const agentId = data.agentId || data.agent?.id;
        if (agentId) {
          loadCommissionsAndWallet(agentId);
        }
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

  const loadCommissionsAndWallet = async (agentId: string) => {
    setLoadingCommissions(true);
    try {
      const response = await fetch(`/api/agent-referrals/commissions?agentId=${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
        setWalletBalance(data.walletBalance || { available: 0, pending: 0, total: 0 });
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setLoadingCommissions(false);
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
            <p className='dashboard-subtitle'>Welcome back, {agent?.full_name || 'Agent'}</p>
          </div>
        </div>

        {/* Horizontal Tabs Navigation */}
        <div className='agent-dashboard-tabs'>
          <button
            className={`dashboard-tab ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            Invoice
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Info
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            My Booking
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'commissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('commissions')}
          >
            Commissions
          </button>
        </div>

        {/* Main Content */}
        <main className='agent-dashboard-main'>
            {activeTab === 'invoice' && subscription && (
              <div className='dashboard-card'>
                <h2 className='card-title'>Invoice Details</h2>
                {subscription.payment_status === 'completed' ? (
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
                ) : (
                  <p className='invoice-pending'>Payment is pending. Invoice will be available after payment completion.</p>
                )}
              </div>
            )}

            {activeTab === 'personal' && (
              <div className='dashboard-card'>
                <h2 className='card-title'>Personal Information</h2>
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
                  {subscription && (
                    <>
                      <div className='info-item'>
                        <label className='info-label'>Subscription Status</label>
                        <p className={`info-value status ${subscription.is_active ? 'active' : 'inactive'}`}>
                          {subscription.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className='info-item'>
                        <label className='info-label'>Expiry Date</label>
                        <p className='info-value'>
                          {format(new Date(subscription.end_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className='dashboard-card'>
                <h2 className='card-title'>My Bookings</h2>
                <div className='bookings-empty'>
                  <p>No bookings yet. Your bookings will appear here.</p>
                </div>
              </div>
            )}

            {activeTab === 'commissions' && (
              <div className='commissions-dashboard'>
                {loadingCommissions ? (
                  <div className='loading-state'>Loading...</div>
                ) : (
                  <>
                    {/* Wallet Summary Cards */}
                    <div className='wallet-summary-cards'>
                      <div className='wallet-summary-card available'>
                        <div className='wallet-card-content'>
                          <p className='wallet-label'>Available Balance</p>
                          <p className='wallet-amount'>AED {walletBalance.available.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className='wallet-summary-card pending'>
                        <div className='wallet-card-content'>
                          <p className='wallet-label'>Pending</p>
                          <p className='wallet-amount'>AED {walletBalance.pending.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className='wallet-summary-card total'>
                        <div className='wallet-card-content'>
                          <p className='wallet-label'>Total Earnings</p>
                          <p className='wallet-amount'>AED {walletBalance.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Commissions Cards Grid */}
                    <div className='commissions-section'>
                      <h2 className='commissions-section-title'>Commission History</h2>
                      {commissions.length === 0 ? (
                        <div className='commissions-empty-state'>
                          <div className='empty-state-icon'>
                            <TrendingUp size={48} />
                          </div>
                          <h3 className='empty-state-title'>No Commissions Yet</h3>
                          <p className='empty-state-description'>
                            Start sharing your referral links to earn commissions on successful bookings.
                          </p>
                        </div>
                      ) : (
                        <div className='commissions-grid'>
                          {commissions.map((commission: any) => (
                            <div key={commission.id} className='commission-card'>
                              <div className='commission-card-header'>
                                <div className='commission-amount'>
                                  <span className='commission-currency'>{commission.currency}</span>
                                  <span className='commission-value'>{commission.amount.toFixed(2)}</span>
                                </div>
                                <span className={`commission-status-badge status-${commission.status}`}>
                                  {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                                </span>
                              </div>
                              <div className='commission-card-body'>
                                <div className='commission-detail-row'>
                                  <span className='commission-detail-label'>Booking ID</span>
                                  <span className='commission-detail-value'>
                                    #{commission.booking_id?.slice(0, 8).toUpperCase() || 'N/A'}
                                  </span>
                                </div>
                                <div className='commission-detail-row'>
                                  <span className='commission-detail-label'>Commission Rate</span>
                                  <span className='commission-detail-value'>{commission.commission_rate}%</span>
                                </div>
                                <div className='commission-detail-row'>
                                  <span className='commission-detail-label'>Date</span>
                                  <span className='commission-detail-value'>
                                    {format(new Date(commission.created_at), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
      </div>
    </div>
  );
}
