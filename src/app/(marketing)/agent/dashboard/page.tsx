'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Wallet, TrendingUp, Link2, Copy, Check, ExternalLink, Percent, DollarSign, Package, RefreshCw } from 'lucide-react';
import { generateShortSlug } from '@/lib/utils';
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

type TabType = 'invoice' | 'personal' | 'bookings' | 'commissions' | 'share-links';

interface PackageForSharing {
  package_id: string;
  package_name: string;
  package_price: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  thumbnail_image: string | null;
  agent_discount: number | null;
  category_name?: string;
  category_slug?: string;
}

interface GeneratedReferral {
  id: string;
  code: string;
  linkType: 'discount' | 'commission';
  discountPercentage: number;
  packageId: string;
  packageName: string;
  expiresAt: string;
  fullUrl?: string;
}

interface ExistingReferral {
  id: string;
  referral_code: string;
  link_type: 'discount' | 'commission';
  discount_percentage: number;
  package_id: string;
  package_name: string;
  expires_at: string;
  usage_count: number;
  created_at: string;
}

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
  
  // Share Links state
  const [packagesForSharing, setPackagesForSharing] = useState<PackageForSharing[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedReferral, setGeneratedReferral] = useState<GeneratedReferral | null>(null);
  const [existingReferrals, setExistingReferrals] = useState<ExistingReferral[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Load packages for sharing
  const loadPackagesForSharing = useCallback(async () => {
    setLoadingPackages(true);
    try {
      const response = await fetch('/api/packages?limit=100&hasAgentDiscount=true');
      if (response.ok) {
        const data = await response.json();
        setPackagesForSharing(data.data || []);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  // Load existing referrals for this agent
  const loadExistingReferrals = useCallback(async () => {
    setLoadingReferrals(true);
    try {
      const response = await fetch('/api/agent-referrals/generate');
      if (response.ok) {
        const data = await response.json();
        setExistingReferrals(data.referrals || []);
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoadingReferrals(false);
    }
  }, []);

  // Generate referral link
  const generateReferralLink = async (linkType: 'discount' | 'commission') => {
    if (!selectedPackageId) {
      toast.error('Please select a package');
      return;
    }

    setGeneratingLink(true);
    try {
      const response = await fetch('/api/agent-referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackageId,
          linkType,
        }),
      });

      const data = await response.json();

      if (data.success && data.referral) {
        // Find the selected package to get category info
        const selectedPkg = packagesForSharing.find(p => p.package_id === selectedPackageId);
        const categorySlug = selectedPkg?.category_slug || 'packages';
        
        // Generate package slug for URL using the same function as the rest of the app
        const packageSlug = selectedPkg
          ? generateShortSlug(
              selectedPkg.package_name,
              selectedPkg.package_id,
              selectedPkg.package_days,
              selectedPkg.package_nights
            )
          : selectedPackageId;
        
        // Build full URL
        const baseUrl = window.location.origin;
        const fullUrl = `${baseUrl}/category/${categorySlug}/${packageSlug}?ref=${data.referral.code}`;

        setGeneratedReferral({
          ...data.referral,
          fullUrl,
        });
        
        toast.success(data.message || 'Referral link generated!');
        
        // Refresh existing referrals list
        loadExistingReferrals();
      } else {
        toast.error(data.error || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Failed to generate referral link');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Build URL for existing referral
  const buildReferralUrl = (referral: ExistingReferral): string => {
    const selectedPkg = packagesForSharing.find(p => p.package_id === referral.package_id);
    const categorySlug = selectedPkg?.category_slug || 'packages';
    
    // Use the same slug generation function as the rest of the app
    const packageSlug = selectedPkg
      ? generateShortSlug(
          selectedPkg.package_name,
          selectedPkg.package_id,
          selectedPkg.package_days,
          selectedPkg.package_nights
        )
      : referral.package_id; // Fallback to package_id if package not found
    
    return `${window.location.origin}/category/${categorySlug}/${packageSlug}?ref=${referral.referral_code}`;
  };

  // Load packages when Share Links tab is active
  useEffect(() => {
    if (activeTab === 'share-links' && packagesForSharing.length === 0) {
      loadPackagesForSharing();
      loadExistingReferrals();
    }
  }, [activeTab, packagesForSharing.length, loadPackagesForSharing, loadExistingReferrals]);


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
          <button
            className={`dashboard-tab ${activeTab === 'share-links' ? 'active' : ''}`}
            onClick={() => setActiveTab('share-links')}
          >
            <Link2 size={16} style={{ marginRight: '6px' }} />
            Share Links
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

            {activeTab === 'share-links' && (
              <div className='share-links-dashboard'>
                {/* Link Generator Section */}
                <div className='dashboard-card share-link-generator'>
                  <h2 className='card-title'>
                    <Link2 size={20} />
                    Generate Referral Link
                  </h2>
                  <p className='card-description'>
                    Create shareable links for packages. Choose between giving customers a discount or earning a commission.
                  </p>

                  {/* Package Selector */}
                  <div className='share-link-form'>
                    <div className='form-group'>
                      <label className='form-label'>Select Package</label>
                      {loadingPackages ? (
                        <div className='loading-state'>Loading packages...</div>
                      ) : packagesForSharing.length === 0 ? (
                        <p className='no-packages-message'>
                          No packages with agent discount available. Contact admin to set up discounts.
                        </p>
                      ) : (
                        <select
                          className='form-select'
                          value={selectedPackageId}
                          onChange={(e) => {
                            setSelectedPackageId(e.target.value);
                            setGeneratedReferral(null);
                          }}
                        >
                          <option value=''>-- Select a package --</option>
                          {packagesForSharing.map((pkg) => (
                            <option key={pkg.package_id} value={pkg.package_id}>
                              {pkg.package_name} {pkg.agent_discount ? `(${pkg.agent_discount}% discount)` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {selectedPackageId && (
                      <div className='link-type-options'>
                        <p className='options-label'>Choose Link Type:</p>
                        <div className='link-type-cards'>
                          {/* Discount Link Option */}
                          <div className='link-type-card discount'>
                            <div className='link-type-icon'>
                              <Percent size={24} />
                            </div>
                            <h3 className='link-type-title'>Discount Link</h3>
                            <p className='link-type-description'>
                              Customer sees discounted price. You don&apos;t earn commission.
                            </p>
                            <ul className='link-type-features'>
                              <li>✓ Customer gets {packagesForSharing.find(p => p.package_id === selectedPackageId)?.agent_discount || 0}% off</li>
                              <li>✓ Higher conversion rate</li>
                              <li>✗ No commission earned</li>
                            </ul>
                            <button
                              className='generate-btn discount'
                              onClick={() => generateReferralLink('discount')}
                              disabled={generatingLink}
                            >
                              {generatingLink ? <RefreshCw className='spin' size={16} /> : <Link2 size={16} />}
                              Generate Discount Link
                            </button>
                          </div>

                          {/* Commission Link Option */}
                          <div className='link-type-card commission'>
                            <div className='link-type-icon'>
                              <DollarSign size={24} />
                            </div>
                            <h3 className='link-type-title'>Commission Link</h3>
                            <p className='link-type-description'>
                              Customer sees full price. You earn commission on sale.
                            </p>
                            <ul className='link-type-features'>
                              <li>✓ Earn commission on booking</li>
                              <li>✓ Passive income</li>
                              <li>✗ Customer pays full price</li>
                            </ul>
                            <button
                              className='generate-btn commission'
                              onClick={() => generateReferralLink('commission')}
                              disabled={generatingLink}
                            >
                              {generatingLink ? <RefreshCw className='spin' size={16} /> : <Link2 size={16} />}
                              Generate Commission Link
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Generated Link Display */}
                    {generatedReferral && (
                      <div className='generated-link-section'>
                        <h3 className='generated-link-title'>
                          🎉 Your {generatedReferral.linkType === 'discount' ? 'Discount' : 'Commission'} Link is Ready!
                        </h3>
                        <div className='generated-link-box'>
                          <input
                            type='text'
                            className='generated-link-input'
                            value={generatedReferral.fullUrl || ''}
                            readOnly
                          />
                          <button
                            className='copy-btn'
                            onClick={() => copyToClipboard(generatedReferral.fullUrl || '', generatedReferral.id)}
                          >
                            {copiedId === generatedReferral.id ? <Check size={18} /> : <Copy size={18} />}
                            {copiedId === generatedReferral.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <p className='generated-link-info'>
                          {generatedReferral.linkType === 'discount' 
                            ? `Customers using this link will see ${generatedReferral.discountPercentage}% off.`
                            : 'Customers using this link will see full price. You earn commission on successful bookings.'}
                        </p>
                        <p className='generated-link-expiry'>
                          Expires: {format(new Date(generatedReferral.expiresAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Existing Referrals Section */}
                <div className='dashboard-card existing-referrals'>
                  <div className='card-header-with-action'>
                    <h2 className='card-title'>
                      <Package size={20} />
                      Your Referral Links
                    </h2>
                    <button 
                      className='refresh-btn'
                      onClick={loadExistingReferrals}
                      disabled={loadingReferrals}
                    >
                      <RefreshCw size={16} className={loadingReferrals ? 'spin' : ''} />
                      Refresh
                    </button>
                  </div>

                  {loadingReferrals ? (
                    <div className='loading-state'>Loading your referrals...</div>
                  ) : existingReferrals.length === 0 ? (
                    <div className='empty-referrals'>
                      <Link2 size={48} className='empty-icon' />
                      <p>No referral links yet. Generate your first link above!</p>
                    </div>
                  ) : (
                    <div className='referrals-list'>
                      {existingReferrals.map((referral) => (
                        <div key={referral.id} className={`referral-item ${referral.link_type}`}>
                          <div className='referral-item-header'>
                            <span className={`referral-type-badge ${referral.link_type}`}>
                              {referral.link_type === 'discount' ? (
                                <><Percent size={12} /> Discount</>
                              ) : (
                                <><DollarSign size={12} /> Commission</>
                              )}
                            </span>
                            <span className='referral-usage'>
                              Used: {referral.usage_count} times
                            </span>
                          </div>
                          <h4 className='referral-package-name'>{referral.package_name}</h4>
                          {referral.link_type === 'discount' && (
                            <p className='referral-discount-info'>
                              {referral.discount_percentage}% discount for customers
                            </p>
                          )}
                          <div className='referral-link-row'>
                            <input
                              type='text'
                              className='referral-link-input'
                              value={buildReferralUrl(referral)}
                              readOnly
                            />
                            <button
                              className='copy-btn-small'
                              onClick={() => copyToClipboard(buildReferralUrl(referral), referral.id)}
                            >
                              {copiedId === referral.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            <a
                              href={buildReferralUrl(referral)}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='open-link-btn'
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                          <div className='referral-meta'>
                            <span>Created: {format(new Date(referral.created_at), 'MMM dd, yyyy')}</span>
                            <span>Expires: {format(new Date(referral.expires_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
      </div>
    </div>
  );
}
