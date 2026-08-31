import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  UserPlus,
  Calendar,
  Activity,
  Briefcase,
  AlertCircle
} from 'react-feather';
import { policyService } from '../../services/policy';
import { clientService } from '../../services/client';
import Header from '../header';
import SidebarNav from '../sidebar';

// Types
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
  totalPolicies: number;
  totalClients: number;
  totalPremium: number;
  activePolicies: number;
  finalisedPolicies: number;
  cancelledPolicies: number;
  unfinalisedPolicies: number;
  newPolicies30Days: number;
  newClients30Days: number;
  monthlyPremium: number;
  cancellationRate: number;
  topAgents: { name: string; count: number; premium: number }[];
  productTypeDistribution: { name: string; value: number }[];
  monthlyTrend: { month: string; policies: number; premium: number }[];
  recentPolicies: Policy[];
}

const COLORS = ['#2a9d36', '#fd7e14', '#c70e2a', '#0d6efd', '#6f42c1', '#17a2b8', '#F15A29', '#20c997'];

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const policyRes = await policyService.getPolicies();
      const clientRes = await clientService.getClients();
      
      if (policyRes.success && clientRes.success) {
        const policies = policyRes.data || [];
        const clients = clientRes.data || [];
        
        // Calculate stats
        const totalPolicies = policies.length;
        const totalClients = clients.length;
        
        // Status counts
        const finalised = policies.filter((p: any) => 
          p.policy_status?.toLowerCase().includes('finalised')
        ).length;
        const active = policies.filter((p: any) => 
          p.policy_status?.toLowerCase().includes('active')
        ).length;
        const cancelled = policies.filter((p: any) => 
          p.policy_status?.toLowerCase().includes('cancelled')
        ).length;
        const unfinalised = policies.filter((p: any) => 
          p.policy_status?.toLowerCase().includes('unfinalised')
        ).length;

        // Total premium
        const totalPremium = policies.reduce((sum: number, p: any) => 
          sum + (Number(p.annualised_premium) || 0), 0
        );

        // 30 day stats
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newPolicies30Days = policies.filter((p: any) => 
          new Date(p.created_at) >= thirtyDaysAgo
        ).length;
        const newClients30Days = clients.filter((c: any) => 
          new Date(c.created_at) >= thirtyDaysAgo
        ).length;

        // Monthly trend (last 6 months)
        const monthlyTrend = getMonthlyTrend(policies);

        // Product type distribution
        const productTypeMap = new Map();
        policies.forEach((p: any) => {
          const type = p.product_type || 'Uncategorized';
          productTypeMap.set(type, (productTypeMap.get(type) || 0) + 1);
        });
        const productTypeDistribution = Array.from(productTypeMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        // Top agents
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

        // Recent policies
        const recentPolicies = policies
          .sort((a: any, b: any) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
          .slice(0, 5);

        setStats({
          totalPolicies,
          totalClients,
          totalPremium,
          activePolicies: active,
          finalisedPolicies: finalised,
          cancelledPolicies: cancelled,
          unfinalisedPolicies: unfinalised,
          newPolicies30Days,
          newClients30Days,
          monthlyPremium: totalPremium / 12,
          cancellationRate: totalPolicies > 0 ? (cancelled / totalPolicies) * 100 : 0,
          topAgents,
          productTypeDistribution,
          monthlyTrend,
          recentPolicies
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyTrend = (policies: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { month: string; policies: number; premium: number }[] = [];
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = months[date.getMonth()];
      
      const monthPolicies = policies.filter((p: any) => {
        const created = new Date(p.created_at);
        return created.getMonth() === date.getMonth() && 
               created.getFullYear() === date.getFullYear();
      });
      
      const count = monthPolicies.length;
      const premium = monthPolicies.reduce((sum: number, p: any) => 
        sum + (Number(p.annualised_premium) || 0), 0
      );
      
      result.push({
        month: monthName,
        policies: count,
        premium: premium
      });
    }
    return result;
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  
// Line chart options
const lineChartOptions = {
  chart: {
    type: 'area' as const,
    height: 280,
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' as const, width: 2 },
  colors: ['#c70e2a'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.5,
      opacityTo: 0.1
    }
  },
  xaxis: {
    categories: stats?.monthlyTrend.map(d => d.month) || [],
    labels: { style: { fontSize: '11px' } }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `KES ${formatCurrency(val)}`
    }
  },
  tooltip: {
    y: {
      formatter: (val: number) => `KES ${formatCurrency(val)}`
    }
  },
  grid: {
    borderColor: '#f0f0f0',
    strokeDashArray: 4
  }
};

// Pie chart options
const pieChartOptions = {
  chart: {
    type: 'donut' as const,
    height: 280,
    toolbar: { show: false }
  },
  labels: stats?.productTypeDistribution.map(d => d.name) || [],
  colors: COLORS,
  legend: {
    position: 'bottom' as const,
    fontSize: '12px',
    labels: {
      colors: '#333'
    }
  },
  dataLabels: {
    enabled: false
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%'
      }
    }
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} policies`
    }
  }
};

 const barChartOptions = {
  chart: {
    type: 'bar' as const,
    height: 350,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: false,
      columnWidth: '50%',
      distributed: false
    }
  },
  dataLabels: { enabled: false },
  colors: ['#2a9d36'],
  xaxis: {
    categories: stats?.topAgents.map(d => d.name) || [],
    labels: { 
      style: { fontSize: '11px' },
      rotate: -45,
      trim: true,
      maxHeight: 80
    }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `${val}`,
      style: { fontSize: '11px' }
    },
    tickAmount: 5
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} policies`
    }
  },
  grid: {
    borderColor: '#f0f0f0',
    strokeDashArray: 4,
    position: 'back' as const
  }
};

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
                <h3 className="page-title">Welcome to Hisa Insurance CRM</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item active">Dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ===== KPI CARDS ===== */}
<div className="row" style={{ marginBottom: '20px' }}>
  {/* Total Policies */}
  <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
    <div className="card" style={{ height: '100%' }}>
      <div className="card-body" style={{ padding: '20px' }}>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <span className="text-muted" style={{ fontSize: '13px' }}>Total Policies</span>
            <h3 className="mb-0" style={{ fontSize: '28px', fontWeight: '700', color: '#2a9d36' }}>
              {stats.totalPolicies}
            </h3>
          </div>
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ 
              width: '46px', 
              height: '46px', 
              backgroundColor: '#e8f5e9'
            }}
          >
            <FileText size={20} color="#2a9d36" />
          </div>
        </div>
        <div className="mt-2">
          <small className="text-success" style={{ fontSize: '12px' }}>
            <TrendingUp size={12} className="me-1" />
            +{stats.newPolicies30Days} in last 30 days
          </small>
        </div>
      </div>
    </div>
  </div>

  {/* Total Clients */}
  <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
    <div className="card" style={{ height: '100%' }}>
      <div className="card-body" style={{ padding: '20px' }}>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <span className="text-muted" style={{ fontSize: '13px' }}>Total Clients</span>
            <h3 className="mb-0" style={{ fontSize: '28px', fontWeight: '700', color: '#0d6efd' }}>
              {stats.totalClients}
            </h3>
          </div>
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ 
              width: '46px', 
              height: '46px', 
              backgroundColor: '#e3f2fd'
            }}
          >
            <Users size={20} color="#0d6efd" />
          </div>
        </div>
        <div className="mt-2">
          <small className="text-primary" style={{ fontSize: '12px' }}>
            <TrendingUp size={12} className="me-1" />
            +{stats.newClients30Days} in last 30 days
          </small>
        </div>
      </div>
    </div>
  </div>

  {/* Total Premium */}
  <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
    <div className="card" style={{ height: '100%' }}>
      <div className="card-body" style={{ padding: '20px' }}>
        <div className="d-flex justify-content-between align-items-start">
          <div style={{ flex: 1 }}>
            <span className="text-muted" style={{ fontSize: '13px' }}>Total Premium</span>
            <div 
              className="mb-0" 
              style={{ 
                fontSize: '22px', 
                fontWeight: '700', 
                color: '#856404',
                lineHeight: '1.2'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '400' }}>KES</span>{' '}
              {formatCurrency(stats.totalPremium)}
            </div>
          </div>
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ 
              width: '46px', 
              height: '46px', 
              backgroundColor: '#fff3cd',
              marginLeft: '10px'
            }}
          >
            <DollarSign size={20} color="#856404" />
          </div>
        </div>
        <div className="mt-2">
          <small className="text-warning" style={{ fontSize: '12px' }}>
            <Calendar size={12} className="me-1" />
            Monthly: KES {formatCurrency(stats.monthlyPremium)}
          </small>
        </div>
      </div>
    </div>
  </div>

  {/* Active Policies */}
  <div className="col-xl-3 col-sm-6 col-12" style={{ marginBottom: '15px' }}>
    <div className="card" style={{ height: '100%' }}>
      <div className="card-body" style={{ padding: '20px' }}>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <span className="text-muted" style={{ fontSize: '13px' }}>Active Policies</span>
            <h3 className="mb-0" style={{ fontSize: '28px', fontWeight: '700', color: '#2a9d36' }}>
              {stats.activePolicies + stats.finalisedPolicies}
            </h3>
          </div>
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ 
              width: '46px', 
              height: '46px', 
              backgroundColor: '#e8f5e9'
            }}
          >
            <CheckCircle size={20} color="#2a9d36" />
          </div>
        </div>
        <div className="mt-2">
          <small className="text-success" style={{ fontSize: '12px' }}>
            <CheckCircle size={12} className="me-1" />
            {stats.finalisedPolicies} Finalised · {stats.activePolicies} Active
          </small>
        </div>
      </div>
    </div>
  </div>
</div>

          {/* ===== SECOND ROW - STATUS BREAKDOWN ===== */}
          <div className="row">
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card" style={{ borderLeft: '4px solid #2a9d36' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted" style={{ fontSize: '13px' }}>Finalised</span>
                      <h3 className="mb-0" style={{ color: '#2a9d36' }}>{stats.finalisedPolicies}</h3>
                    </div>
                    <div className="rounded-circle p-2" style={{ backgroundColor: '#e8f5e9' }}>
                      <CheckCircle size={20} color="#2a9d36" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card" style={{ borderLeft: '4px solid #fd7e14' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted" style={{ fontSize: '13px' }}>Pending</span>
                      <h3 className="mb-0" style={{ color: '#fd7e14' }}>{stats.unfinalisedPolicies}</h3>
                    </div>
                    <div className="rounded-circle p-2" style={{ backgroundColor: '#fff3cd' }}>
                      <Clock size={20} color="#fd7e14" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card" style={{ borderLeft: '4px solid #c70e2a' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted" style={{ fontSize: '13px' }}>Cancelled</span>
                      <h3 className="mb-0" style={{ color: '#c70e2a' }}>{stats.cancelledPolicies}</h3>
                    </div>
                    <div className="rounded-circle p-2" style={{ backgroundColor: '#fde8ea' }}>
                      <XCircle size={20} color="#c70e2a" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card" style={{ borderLeft: '4px solid #6f42c1' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted" style={{ fontSize: '13px' }}>Cancellation Rate</span>
                      <h3 className="mb-0" style={{ color: '#6f42c1' }}>{stats.cancellationRate.toFixed(1)}%</h3>
                    </div>
                    <div className="rounded-circle p-2" style={{ backgroundColor: '#f3e8ff' }}>
                      <TrendingDown size={20} color="#6f42c1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ===== CHARTS ROW ===== */}
<div className="row" style={{ marginBottom: '20px' }}>
  {/* Monthly Trend Chart */}
  <div className="col-md-12 col-lg-7" style={{ marginBottom: '15px' }}>
    <div className="card" style={{ height: '100%', minHeight: '380px' }}>
      <div className="card-header">
        <h4 className="card-title">Monthly Premium Trend</h4>
        <p className="text-muted" style={{ fontSize: '12px' }}>Last 6 months</p>
      </div>
      <div className="card-body" style={{ padding: '20px', height: 'calc(100% - 60px)' }}>
        <ReactApexChart
          options={lineChartOptions}
          series={[{ name: 'Premium (KES)', data: stats.monthlyTrend.map(d => d.premium) }]}
          type="area"
          height={280}
        />
      </div>
    </div>
  </div>

  {/* Product Type Distribution */}
  <div className="col-md-12 col-lg-5" style={{ marginBottom: '15px' }}>
    <div className="card" style={{ height: '100%', minHeight: '380px' }}>
      <div className="card-header">
        <h4 className="card-title">Policy Types</h4>
        <p className="text-muted" style={{ fontSize: '12px' }}>Distribution by product type</p>
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
    <div className="card" style={{ height: '100%', minHeight: '380px' }}>
      <div className="card-header">
        <h4 className="card-title">Top Agents</h4>
        <p className="text-muted" style={{ fontSize: '12px' }}>By policies generated</p>
      </div>
      <div className="card-body" style={{ padding: '15px 15px 5px 15px', height: 'calc(100% - 60px)' }}>
        {stats.topAgents.length > 0 ? (
          <ReactApexChart
            options={barChartOptions}
            series={[{ name: 'Policies', data: stats.topAgents.map(d => d.count) }]}
            type="bar"
            height={320}
          />
        ) : (
          <div className="text-center text-muted py-4">No agent data available</div>
        )}
      </div>
    </div>
  </div>

  {/* Recent Activity */}
  <div className="col-md-12 col-lg-5" style={{ marginBottom: '15px' }}>
    <div className="card" style={{ height: '100%', minHeight: '380px' }}>
      <div className="card-header">
        <h4 className="card-title">Recent Activity</h4>
        <p className="text-muted" style={{ fontSize: '12px' }}>Latest policy updates</p>
      </div>
      <div className="card-body" style={{ padding: '15px', height: 'calc(100% - 60px)', overflowY: 'auto' }}>
        {stats.recentPolicies.map((policy, index) => (
          <div 
            key={index} 
            className="d-flex align-items-start mb-2 pb-2"
            style={{ 
              borderBottom: index < stats.recentPolicies.length - 1 ? '1px solid #f0f0f0' : 'none'
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
                    '#e3f2fd'
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
                <span className={`badge ${policy.policy_status?.toLowerCase().includes('finalised') ? 'bg-success' : 
                  policy.policy_status?.toLowerCase().includes('cancelled') ? 'bg-danger' :
                  policy.policy_status?.toLowerCase().includes('unfinalised') ? 'bg-warning text-dark' : 'bg-secondary'}`}
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
    </>
  );
};

export default AdminDashboard;