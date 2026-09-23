import { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'react-feather';
import { policyService } from '../../services/policy';
import { clientService } from '../../services/client';
import { authService } from '../../services/auth';
import Header from '../header';
import SidebarNav from '../sidebar';
import { dashboardService } from '../../services/dashboard';
import { mmfService } from '../../services/mmf';

// ============================================================================
// TYPES
// ============================================================================

interface Policy {
  id: string;
  policy_number: string;
  policy_status: string;
  annualised_premium: number;
  created_at: string;
  updated_at: string;
  agent_name: string;
  product_type: string;
  client_name: string;
}

interface DashboardStats {
  // ── The Book ──
  finalisedPolicies: number;
  totalRecords: number;
  currentPremium: number;
  currentSumInsured: number;

  // ── Clients ──
  totalClients: number;
  insuranceClients: number;
  mmfClients: number;
  mmfAccounts: number;

  // ── Needs Attention ──
  lapsedPolicies: number;
  lapsedArrears: number;
  lapsedRate: number;
  surrenderedPolicies: number;
  surrenderedAmount: number;
  surrenderRate: number;
  newPolicies60Days: number;
  newClients60Days: number;
  crossSellOpportunity: number;
  alfredClients: number;

  // ── Charts ──
  topAgents: { name: string; count: number; premium: number }[];
  productTypeDistribution: { name: string; value: number }[];
  monthlyTrend: { month: string; policies: number; premium: number }[];
  recentPolicies: Policy[];
  monthlyNewPolicies: { month: string; count: number }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = ['#2a9d36', '#fd7e14', '#c70e2a', '#0d6efd', '#6f42c1', '#17a2b8', '#F15A29', '#20c997'];

// ============================================================================
// COMPONENT
// ============================================================================

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [performance, setPerformance] = useState<{ years: number[]; actual: number[]; potential: number[] } | null>(null);

  const [mmfStats, setMmfStats] = useState<{ accounts: number; holderRows: number; distinctClients: number } | null>(null);

  useEffect(() => {
    const userData = authService.getCurrentUser();
    if (userData) {
      setUser(userData);
    }
  }, []);

  useEffect(() => {
  const loadPerformance = async () => {
    try {
      const res = await dashboardService.getPerformance();
      if (res.success) setPerformance(res.data);
    } catch (err) {
      console.error('Performance fetch failed:', err);
    }
  };
  loadPerformance();
}, []);

useEffect(() => {
  const loadMmfStats = async () => {
    try {
      const res = await mmfService.getMmfStats();
      if (res.success) setMmfStats(res.data);
    } catch (err) {
      console.error('MMF stats fetch failed:', err);
    }
  };
  loadMmfStats();
}, []);

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  /** Compact currency, e.g., KES 289.5M, KES 6.21B, KES 890K. */
  const formatCompact = (value: any) => {
    const num = Number(value) || 0;
    if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString('en-US');
  };

  /** Classify a raw policy status into one of the defined buckets. */
  const cleanPolicyStatus = (status: string) => {
    if (!status) return 'Not Given';
    const lower = status.toLowerCase();
    if (lower.includes('unsuccessful')) return 'Unsuccessful';
    if (lower.includes('unverified')) return 'Unverified';
    if (lower.includes('unfinalised')) return 'Unverified';
    if (lower.includes('finalised')) return 'Finalised';
    if (lower.includes('paid') || lower.includes('active')) return 'Paid';
    if (lower.includes('surrender')) return 'Surrendered';
    if (lower.includes('lapsed')) return 'Lapsed';
    if (lower.includes('cancel')) return 'Cancelled';
    return 'Not Given';
  };

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const policyRes = await policyService.getPolicies();
      const clientRes = await clientService.getClients({ includeMmfOnly: true });

      if (policyRes.success && clientRes.success) {
        const policies = policyRes.data || [];
        const clients = clientRes.data || [];

        // ────────────────────────────────────────────────────────────
        // Status buckets
        // ────────────────────────────────────────────────────────────
        const finalised = policies.filter((p: any) =>
          cleanPolicyStatus(p.policy_status) === 'Finalised'
        );
        const lapsed = policies.filter((p: any) =>
          cleanPolicyStatus(p.policy_status) === 'Lapsed'
        );
        const surrendered = policies.filter((p: any) =>
          cleanPolicyStatus(p.policy_status) === 'Surrendered'
        );
        const cancelled = policies.filter((p: any) =>
          cleanPolicyStatus(p.policy_status) === 'Cancelled'
        );

        const totalPolicies = policies.length;

        // ────────────────────────────────────────────────────────────
        // The Book — Finalised only
        // ────────────────────────────────────────────────────────────
        const currentPremium = finalised.reduce((sum: number, p: any) =>
          sum + (Number(p.new_gross_premium) || 0), 0
        );
        const currentSumInsured = finalised.reduce((sum: number, p: any) =>
          sum + (Number(p.total_sum_insured) || 0), 0
        );

        // ────────────────────────────────────────────────────────────
        // Clients & MMF
        // ────────────────────────────────────────────────────────────
        const totalClients = clients.length;
        const insuranceClients = clients.filter((c: any) => (c.policy_count || 0) > 0).length;
        const mmfClients = clients.filter((c: any) => ((c as any).mmf_count || 0) > 0).length;
        const mmfAccounts = clients.reduce((sum: number, c: any) =>
          sum + (Number((c as any).mmf_count) || 0), 0
        );
        const crossSellOpportunity = clients.filter((c: any) =>
          (c.policy_count || 0) > 0 && ((c as any).mmf_count || 0) === 0
        ).length;

        // Alfred's unique clients:
          //   (a) clients with at least one policy under him, PLUS
          //   (b) every client with an MMF account (MMF is always his)
          const alfredClientIds = new Set<string>();
          policies.forEach((p: any) => {
            if ((p.agent_name || '').trim() === 'Alfred Mathu' && p.client_id) {
              alfredClientIds.add(p.client_id);
            }
          });
          clients.forEach((c: any) => {
            if ((c.mmf_count || 0) > 0) {
              alfredClientIds.add(c.id);
            }
          });
          const alfredClients = alfredClientIds.size;

        // ────────────────────────────────────────────────────────────
        // 60-day window — inception_date for new business
        // ────────────────────────────────────────────────────────────
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const newPolicies60Days = policies.filter((p: any) => {
          if (!p.inception_date) return false;
          return new Date(p.inception_date) >= sixtyDaysAgo;
        }).length;

        // New clients: earliest policy's inception_date in the last 60 days.
        // MMF-only clients are excluded (no inception concept for MMF).
        const newClients60Days = clients.filter((c: any) => {
          const clientPolicies = policies.filter((p: any) =>
            p.client_id === c.id && p.inception_date
          );
          if (clientPolicies.length === 0) return false;
          const earliestInception = clientPolicies.reduce(
            (min: string, p: any) =>
              new Date(p.inception_date) < new Date(min) ? p.inception_date : min,
            clientPolicies[0].inception_date
          );
          return new Date(earliestInception) >= sixtyDaysAgo;
        }).length;

        // ────────────────────────────────────────────────────────────
        // Attrition rates (static — no time window)
        // Denominator = policies still relevant to the book
        // ────────────────────────────────────────────────────────────
        const attritionDenom =
          finalised.length + lapsed.length + surrendered.length + cancelled.length;

        const lapsedRate = attritionDenom > 0
          ? (lapsed.length / attritionDenom) * 100
          : 0;
        const surrenderRate = attritionDenom > 0
          ? (surrendered.length / attritionDenom) * 100
          : 0;

        // ────────────────────────────────────────────────────────────
        // Lapsed arrears + surrendered amount
        // ────────────────────────────────────────────────────────────
        const lapsedArrears = lapsed.reduce((sum: number, p: any) =>
          sum + (Number(p.arrears_due) || 0), 0
        );
        const surrenderedAmount = surrendered.reduce((sum: number, p: any) =>
          sum + (Number(p.surrender_amount) || 0), 0
        );

        // ────────────────────────────────────────────────────────────
        // Monthly trend (uses inception_date)
        // ────────────────────────────────────────────────────────────
        const monthlyTrend = getMonthlyTrend(policies);
        /** Count policies started per month for the last 12 months (by inception_date). */
        const getMonthlyNewPolicies = (policies: any[]) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const result: { month: string; count: number }[] = [];

          const now = new Date();
          for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const monthIdx = date.getMonth();
            const label = `${months[monthIdx]} '${String(year).slice(-2)}`;

            const count = policies.filter((p: any) => {
              if (!p.inception_date) return false;
              const d = new Date(p.inception_date);
              return d.getFullYear() === year && d.getMonth() === monthIdx;
            }).length;

            result.push({ month: label, count });
          }
          return result;
        };

        const monthlyNewPolicies = getMonthlyNewPolicies(policies);

        // ────────────────────────────────────────────────────────────
        // business distribution (policies + MMF as a segment)
        // ────────────────────────────────────────────────────────────
        const productTypeMap = new Map();
        policies.forEach((p: any) => {
          const type = p.product_type || 'Uncategorized';
          productTypeMap.set(type, (productTypeMap.get(type) || 0) + 1);
        });
        const productTypeDistribution = Array.from(productTypeMap.entries())
          .map(([name, value]) => ({ name, value: value as number }))
          .sort((a, b) => b.value - a.value);

        if (mmfAccounts > 0) {
          productTypeDistribution.push({ name: 'Money Market Fund', value: mmfAccounts });
        }

        // ────────────────────────────────────────────────────────────
        // Top agents
        // ────────────────────────────────────────────────────────────
        const agentMap = new Map();
        policies.forEach((p: any) => {
          const name = p.agent_name || 'Unknown';
          if (!agentMap.has(name)) {
            agentMap.set(name, { name, count: 0, premium: 0 });
          }
          agentMap.get(name).count++;
          agentMap.get(name).premium += Number(p.annualised_premium) || 0;
        });
        const topAgents = Array.from(agentMap.values())
          .sort((a, b) => b.premium - a.premium)
          .slice(0, 5);

        // ────────────────────────────────────────────────────────────
        // Recent activity (by updated_at)
        // ────────────────────────────────────────────────────────────
        const recentPolicies = policies
          .sort((a: any, b: any) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
          .slice(0, 5);

        setStats({
          // The Book
          finalisedPolicies: finalised.length,
          totalRecords: totalPolicies,
          currentPremium,
          currentSumInsured,

          // Clients
          totalClients,
          insuranceClients,
          mmfClients,
          mmfAccounts,

          // Needs Attention
          lapsedPolicies: lapsed.length,
          lapsedArrears,
          lapsedRate,
          surrenderedPolicies: surrendered.length,
          surrenderedAmount,
          surrenderRate,
          newPolicies60Days,
          newClients60Days,
          crossSellOpportunity,
          alfredClients,

          // Charts
          topAgents,
          productTypeDistribution,
          monthlyTrend,
          recentPolicies,
          monthlyNewPolicies,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /** Build monthly counts + premium for the last 6 months, based on inception_date. */
  const getMonthlyTrend = (policies: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { month: string; policies: number; premium: number }[] = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];

      const monthPolicies = policies.filter((p: any) => {
        if (!p.inception_date) return false;
        const inception = new Date(p.inception_date);
        return inception.getMonth() === date.getMonth() &&
               inception.getFullYear() === date.getFullYear();
      });

      const count = monthPolicies.length;
      const premium = monthPolicies.reduce((sum: number, p: any) =>
        sum + (Number(p.new_gross_premium) || 0), 0
      );

      result.push({
        month: monthName,
        policies: count,
        premium: premium,
      });
    }
    return result;
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ==========================================================================
  // CHART OPTIONS
  // ==========================================================================

  const performanceChartOptions = {
  chart: {
    type: 'line' as const,
    height: 320,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' as const, width: 3 },
  colors: ['#c70e2a', '#2a9d36'],
  markers: { size: 5, strokeWidth: 0 },
  xaxis: {
    categories: performance?.years || [],
    labels: { style: { fontSize: '11px', colors: '#999' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `KES ${formatCompact(val)}`,
      style: { fontSize: '11px', colors: '#999' },
    },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    fontSize: '12px',
    labels: { colors: '#666' },
  },
  tooltip: {
    y: { formatter: (val: number) => `KES ${formatCurrency(val)}` },
  },
  grid: {
    borderColor: '#f0f0f0',
    strokeDashArray: 4,
    padding: { left: 8, right: 8 },
  },
};

  const pieChartOptions = {
    chart: {
      type: 'donut' as const,
      height: 280,
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    labels: stats?.productTypeDistribution.map(d => d.name) || [],
    colors: COLORS,
    legend: {
      position: 'bottom' as const,
      fontSize: '12px',
      labels: { colors: '#666' },
      markers: { size: 4 },
      itemMargin: { horizontal: 8, vertical: 2 },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              color: '#999',
              formatter: (w: any) =>
                String(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)),
            },
            value: {
              fontSize: '20px',
              fontWeight: 700,
              color: '#333',
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} policies`,
      },
    },
  };

  const barChartOptions = {
  chart: {
    type: 'bar' as const,
    height: 350,
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: false,
      columnWidth: '35%',
      distributed: false,
    },
  },
  dataLabels: { enabled: false },
  colors: ['#2a9d36'],
  xaxis: {
    categories: stats?.monthlyNewPolicies.map(d => d.month) || [],
    labels: {
      style: { fontSize: '10px', colors: '#999' },
      rotate: 0,
      trim: true,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `${val}`,
      style: { fontSize: '11px', colors: '#999' },
    },
    tickAmount: 5,
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} policies`,
    },
  },
  grid: {
    borderColor: '#f0f0f0',
    strokeDashArray: 4,
    position: 'back' as const,
  },
};

  // ==========================================================================
  // LOADING / ERROR STATES
  // ==========================================================================

  if (loading) {
    return (
      <>
        <Header />
        <SidebarNav />
        <div className="page-wrapper">
          <div className="content container-fluid">
            <div className="text-center" style={{ padding: '60px 0' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <SidebarNav />
        <div className="page-wrapper">
          <div className="content container-fluid">
            <div className="alert alert-danger">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!stats) return null;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">

          {/* Page Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">
                  👋 Welcome back,{' '}
                  <span style={{ color: '#c70e2a', fontWeight: '700' }}>
                    {user?.firstName || user?.first_name || 'Admin'}
                  </span>{' '}
                  🎉
                </h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item active">Hisa CRM Dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ===== ROW 1 – THE BOOK ===== */}
          <div className="row" style={{ marginBottom: '20px' }}>

            {/* Absa Active Policies */}
            <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%' }}>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="kpi-label">Absa active policies</span>
                      <h3 className="kpi-value" style={{ color: '#2a9d36' }}>
                        {stats.finalisedPolicies}
                      </h3>
                    </div>
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' }}>
                      <FileText size={20} color="#2a9d36" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="kpi-sub">of {stats.totalRecords} total records</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Current Premium + Sum Insured */}
            <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%' }}>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div style={{ flex: 1 }}>
                      <span className="kpi-label">Total Current Premium</span>
                      <div
                        className="kpi-value-money"
                        style={{ color: '#856404' }}
                        title={`KES ${formatCurrency(stats.currentPremium)}`}
                      >
                        <span style={{ fontSize: '13px', fontWeight: '400' }}>KES</span>{' '}
                        {formatCompact(stats.currentPremium)}
                      </div>
                    </div>
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 100%)' }}>
                      <DollarSign size={20} color="#856404" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="kpi-sub">
                      Sum Insured:{' '}
                      <span
                        style={{ color: '#856404', fontWeight: '600' }}
                        title={`KES ${formatCurrency(stats.currentSumInsured)}`}
                      >
                        KES {formatCompact(stats.currentSumInsured)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Hisa Clients */}
            <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%' }}>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="kpi-label">Total Hisa Clients</span>
                      <h3 className="kpi-value" style={{ color: '#0d6efd' }}>
                        {stats.totalClients}
                      </h3>
                    </div>
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #90caf9 100%)' }}>
                      <Users size={20} color="#0d6efd" />
                    </div>
                  </div>
                  <div className="mt-2">
                  <span className="kpi-sub">
                    {stats.alfredClients} Alfred's clients ·{' '}
                    {stats.totalClients > 0
                      ? `${((stats.alfredClients / stats.totalClients) * 100).toFixed(1)}%`
                      : '0%'} of book
                  </span>
                </div>
                </div>
              </div>
            </div>

            {/* MMF Accounts */}
            <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%' }}>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="kpi-label">MMF Accounts</span>
                      <h3 className="kpi-value" style={{ color: '#6f42c1' }}>
                        {mmfStats?.accounts ?? 0}
                      </h3>
                    </div>
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #d8b4fe 100%)' }}>
                      <DollarSign size={20} color="#6f42c1" />
                    </div>
                  </div>
                  <span className="kpi-sub">
                    {mmfStats?.distinctClients ?? 0} clients · {mmfStats?.holderRows ?? 0} holder links
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ===== ROW 2 – NEEDS ATTENTION ===== */}
          <div className="row" style={{ marginBottom: '20px' }}>

            {/* Lapsed Arrears */}
            <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%', borderLeft: '4px solid #d97706' }}>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div style={{ flex: 1 }}>
                      <span className="kpi-label">Lapsed Arrears</span>
                      <div
                        className="kpi-value-money"
                        style={{ color: '#d97706' }}
                        title={`KES ${formatCurrency(stats.lapsedArrears)}`}
                      >
                        <span style={{ fontSize: '12px', fontWeight: '400' }}>KES</span>{' '}
                        {formatCompact(stats.lapsedArrears)}
                      </div>
                    </div>
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #fff8e1 0%, #ffcc80 100%)' }}>
                      <AlertCircle size={20} color="#d97706" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="kpi-sub">
                      {stats.lapsedPolicies} lapsed · {stats.lapsedRate.toFixed(1)}% of book
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Absa Surrendered */}
            <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%', borderLeft: '4px solid #6f42c1' }}>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="kpi-label">Absa Surrendered</span>
                      <h3 className="kpi-value" style={{ color: '#6f42c1' }}>
                        {stats.surrenderedPolicies}
                      </h3>
                    </div>
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #d8b4fe 100%)' }}>
                      <TrendingDown size={20} color="#6f42c1" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className="kpi-sub"
                      title={`KES ${formatCurrency(stats.surrenderedAmount)} lost`}
                    >
                      KES {formatCompact(stats.surrenderedAmount)} lost ·{' '}
                      {stats.surrenderRate.toFixed(1)}% of book
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* New Business Last 60 days */}
            <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%', borderLeft: '4px solid #2a9d36' }}>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="kpi-label">New Business Last 60 days</span>
                      <h3 className="kpi-value" style={{ color: '#2a9d36' }}>
                        +{stats.newPolicies60Days}
                      </h3>
                    </div>
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' }}>
                      <TrendingUp size={20} color="#2a9d36" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="kpi-sub">
                      +{stats.newPolicies60Days} policies · +{stats.newClients60Days} clients
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-sell Opportunity */}
            <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%', borderLeft: '4px solid #6f42c1' }}>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="kpi-label">Cross-sell</span>
                      <h3 className="kpi-value" style={{ color: '#6f42c1' }}>
                        {stats.crossSellOpportunity}
                      </h3>
                    </div>
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #d8b4fe 100%)' }}>
                      <Users size={20} color="#6f42c1" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="kpi-sub">
                      {stats.insuranceClients > 0
                        ? `${((stats.crossSellOpportunity / stats.insuranceClients) * 100).toFixed(1)}% of insurance clients without MMF`
                        : 'No insurance clients yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ===== CHARTS ROW ===== */}
          <div className="row" style={{ marginBottom: '20px' }}>

            <div className="col-md-12 col-lg-7" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%', minHeight: '380px' }}>
                <div className="card-header kpi-card-header">
                  <h4 className="card-title">Annual Performance</h4>
                  <p className="text-muted" style={{ fontSize: '12px', marginBottom: 0 }}>
                    Actual collected vs expected (no lapse / no surrender)
                  </p>
                </div>
                <div className="card-body" style={{ padding: '20px', height: 'calc(100% - 60px)' }}>
                  {performance && performance.years.length > 0 ? (
                    <ReactApexChart
                      options={performanceChartOptions}
                      series={[
                        { name: 'Actual Collected', data: performance.actual },
                        { name: 'If No Lapse/Surrender', data: performance.potential },
                      ]}
                      type="line"
                      height={320}
                    />
                  ) : (
                    <div className="text-center text-muted py-4">No performance data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Distribution */}
            <div className="col-md-12 col-lg-5" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%', minHeight: '380px' }}>
                <div className="card-header kpi-card-header">
                  <h4 className="card-title">Business Distribution</h4>
                  <p className="text-muted" style={{ fontSize: '12px', marginBottom: 0 }}>
                    Policies + MMF accounts
                  </p>
                </div>
                <div className="card-body" style={{ padding: '20px', height: 'calc(100% - 60px)' }}>
                  {stats.productTypeDistribution.length > 0 ? (
                    <ReactApexChart
                      options={pieChartOptions}
                      series={stats.productTypeDistribution.map(d => d.value)}
                      type="donut"
                      height={280}
                    />
                  ) : (
                    <div className="text-center text-muted py-4">No data available</div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* ===== TOP AGENTS & RECENT ACTIVITY ===== */}
          <div className="row" style={{ marginBottom: '20px' }}>

            {/* Top Agents */}
            <div className="col-md-12 col-lg-7" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%', minHeight: '380px' }}>
                <div className="card-header kpi-card-header">
                  <h4 className="card-title">New Business Momentum</h4>
                    <p className="text-muted" style={{ fontSize: '12px', marginBottom: 0 }}>
                      Policies started per month (last 12 months)
                    </p>
                </div>
                <div className="card-body" style={{ padding: '15px 15px 5px 15px', height: 'calc(100% - 60px)' }}>
                  {stats.monthlyNewPolicies.length > 0 ? (
                    <ReactApexChart
                      options={barChartOptions}
                      series={[{ name: 'New Policies', data: stats.monthlyNewPolicies.map(d => d.count) }]}
                      type="bar"
                      height={320}
                    />
                  ) : (
                    <div className="text-center text-muted py-4">No data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="col-md-12 col-lg-5" style={{ marginBottom: '15px' }}>
              <div className="kpi-card" style={{ height: '100%', minHeight: '380px' }}>
                <div className="card-header kpi-card-header">
                  <h4 className="card-title">Recent Activity</h4>
                  <p className="text-muted" style={{ fontSize: '12px', marginBottom: 0 }}>
                    Latest policy updates
                  </p>
                </div>
                <div className="card-body" style={{ padding: '15px', height: 'calc(100% - 60px)', overflowY: 'auto' }}>
                  {stats.recentPolicies.map((policy, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-start mb-2 pb-2"
                      style={{
                        borderBottom: index < stats.recentPolicies.length - 1 ? '1px solid #f0f0f0' : 'none',
                      }}
                    >
                      <div className="flex-shrink-0 me-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor:
                              policy.policy_status?.toLowerCase().includes('finalised') ? '#e8f5e9' :
                              policy.policy_status?.toLowerCase().includes('cancelled') ? '#fde8ea' :
                              policy.policy_status?.toLowerCase().includes('unfinalised') ? '#fff3cd' :
                              '#e3f2fd',
                          }}
                        >
                          {policy.policy_status?.toLowerCase().includes('finalised') && <CheckCircle size={14} color="#2a9d36" />}
                          {policy.policy_status?.toLowerCase().includes('cancelled') && <XCircle size={14} color="#c70e2a" />}
                          {policy.policy_status?.toLowerCase().includes('unfinalised') && <Clock size={14} color="#fd7e14" />}
                          {!policy.policy_status?.toLowerCase().includes('finalised') &&
                           !policy.policy_status?.toLowerCase().includes('cancelled') &&
                           !policy.policy_status?.toLowerCase().includes('unfinalised') &&
                           <FileText size={14} color="#0d6efd" />}
                        </div>
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <span style={{ fontWeight: '500', fontSize: '12px' }}>{policy.policy_number}</span>
                          <span style={{ fontSize: '10px', color: '#999', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                            {policy.updated_at ? new Date(policy.updated_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {policy.client_name || 'Unknown Client'}
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '1px' }}>
                          <span
                            className={`badge ${
                              policy.policy_status?.toLowerCase().includes('finalised') ? 'bg-success' :
                              policy.policy_status?.toLowerCase().includes('cancelled') ? 'bg-danger' :
                              policy.policy_status?.toLowerCase().includes('unfinalised') ? 'bg-warning text-dark' :
                              'bg-secondary'
                            }`}
                            style={{ fontSize: '9px' }}
                          >
                            {policy.policy_status || 'N/A'}
                          </span>
                          <span className="ms-2" style={{ color: '#2a9d36', fontWeight: '500', fontSize: '11px' }}>
                            KES {formatCurrency(policy.annualised_premium)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.recentPolicies.length === 0 && (
                    <div className="text-center text-muted py-4">No recent activity</div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ====================================================================
          CARD STYLING — subtle elevation + hover lift
          No layout or sizing changes; only visual polish.
          ==================================================================== */}
      <style>{`
        .kpi-card {
          background: #ffffff;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }

        .kpi-card:hover {
          box-shadow: 0 6px 16px rgba(16, 24, 40, 0.08);
          transform: translateY(-1px);
          border-color: #e9ecef;
        }

        .kpi-label {
          display: block;
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          letter-spacing: 0.1px;
        }

        .kpi-value {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.5px;
        }

        .kpi-value-money {
          font-size: 22px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.4px;
        }

        .kpi-sub {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .kpi-icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-card-header {
          background: transparent;
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 20px;
        }

        .kpi-card-header .card-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
          color: #1f2937;
        }
      `}</style>
    </>
  );
};

export default AdminDashboard;
