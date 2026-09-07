import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Header from '../header';
import SidebarNav from '../sidebar';
import { FileText, CheckCircle, XCircle, AlertTriangle, AlertCircle } from 'react-feather';
import { reconciliationService } from '../../services/reconciliation';

interface ReportItem {
  policyNumber: string;
  clientName: string;
  agentName: string; 
  outlookFound: boolean;
  dbFound: boolean;
  frequency: string;
  strikeDayOutlook: number | null;
  strikeDayDb: number | null;
  anomaly: string;
  subjectToReview: boolean;
  inceptionDate?: string;
  estimatedDate?: string;
}

interface ReportData {
  summary: {
    totalOutlook: number;
    totalDbInRange: number;
    matched: number;
    missingFromDb: number;
    missingFromOutlook: number;
    strikeDayMismatch: number;
    frequencyMismatch: number;
    subjectToReview: number;
  };
  details: ReportItem[];
  subjectToReviewItems: ReportItem[];
  dateRange: { start: string; end: string };
}

const AdminOutlook = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const response = await reconciliationService.uploadOutlook(file);
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error || 'Failed to process file');
      }
    } catch (err: any) {
      setError(err.error || 'An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setReport(null);
    setError(null);
  };

  const getAnomalyBadge = (anomaly: string) => {
    const styles: Record<string, { bg: string; color: string; icon: ReactNode }> = {
      'Match': { bg: '#e8f5e9', color: '#2a9d36', icon: <CheckCircle size={14} /> },
      'Missing from DB': { bg: '#fde8ea', color: '#c70e2a', icon: <XCircle size={14} /> },
      'Missing from Outlook': { bg: '#fde8ea', color: '#c70e2a', icon: <XCircle size={14} /> },
      'Strike Day Mismatch': { bg: '#fff3cd', color: '#856404', icon: <AlertTriangle size={14} /> },
      'Frequency Mismatch': { bg: '#fff3cd', color: '#856404', icon: <AlertTriangle size={14} /> },
    };
    const style = styles[anomaly] || { bg: '#f1f3f5', color: '#333', icon: <AlertCircle size={14} /> };
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {style.icon} {anomaly}
      </span>
    );
  };

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-7">
                <h3 className="page-title">Outlook Reconciliation</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item"><Link to="/admin-dashboard">Dashboard</Link></li>
                  <li className="breadcrumb-item active">Outlook</li>
                </ul>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  {!report ? (
                    // Upload Section
                    <div>
                      <div
                        className="drop-zone"
                        style={{
                          border: '2px dashed #c70e2a',
                          borderRadius: '10px',
                          padding: '40px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: '#fdf0f2',
                          minHeight: '200px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = '#fce4e8'; }}
                        onDragLeave={(e) => { e.currentTarget.style.backgroundColor = '#fdf0f2'; }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) handleFileSelect(file);
                        }}
                        onClick={() => document.getElementById('fileInput')?.click()}
                      >
                        <FileText size={48} style={{ color: '#c70e2a', marginBottom: '15px' }} />
                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                          Drag & drop your Outlook Excel file here
                        </p>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          or <span style={{ color: '#c70e2a', fontWeight: '500' }}>browse</span> to select a file
                        </p>
                        <input
                          id="fileInput"
                          type="file"
                          accept=".xlsx,.xls"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                        />
                      </div>

                      {file && (
                        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <FileText size={24} style={{ color: '#2a9d36' }} />
                              <span style={{ marginLeft: '10px', fontWeight: '500' }}>{file.name}</span>
                              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <div>
                              <button
                                className="btn btn-sm me-2"
                                onClick={() => setFile(null)}
                                style={{ color: '#c70e2a', background: 'none', border: 'none' }}
                              >
                                <XCircle size={18} />
                              </button>
                              <button
                                className="btn"
                                onClick={handleUpload}
                                disabled={uploading}
                                style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px' }}
                              >
                                {uploading ? 'Processing...' : 'Upload & Process'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {uploading && (
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p style={{ marginTop: '10px', color: '#666' }}>Processing... Please wait.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Report Section
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="card-title mb-0">Outlook Reconciliation Report</h5>
                          <p className="text-muted" style={{ fontSize: '13px' }}>
                            Date Range: {report.dateRange.start} to {report.dateRange.end}
                          </p>
                        </div>
                        <div>
                          <button
                            className="btn me-2"
                            onClick={resetUpload}
                            style={{ backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px' }}
                          >
                            New Upload
                          </button>
                        </div>
                      </div>

                      {/* Summary Cards */}
                      <div className="row mb-4">
                        <div className="col-md-3">
                          <div className="card" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #2a9d36' }}>
                            <div className="card-body">
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#2a9d36' }}>{report.summary.matched}</div>
                              <div style={{ fontSize: '13px', color: '#666' }}>Matched DB</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card" style={{ backgroundColor: '#fde8ea', borderLeft: '4px solid #c70e2a' }}>
                            <div className="card-body">
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#c70e2a' }}>
                                {report.summary.missingFromDb + report.summary.missingFromOutlook}
                              </div>
                              <div style={{ fontSize: '13px', color: '#666' }}>Missing from DB or Outlook</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #856404' }}>
                            <div className="card-body">
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#856404' }}>
                                {report.summary.strikeDayMismatch + report.summary.frequencyMismatch}
                              </div>
                              <div style={{ fontSize: '13px', color: '#666' }}>Strike Day Mismatches</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card" style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #0d6efd' }}>
                            <div className="card-body">
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0d6efd' }}>{report.summary.subjectToReview}</div>
                              <div style={{ fontSize: '13px', color: '#666' }}>Needs Manual Review</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Table – only show non‑Match anomalies */}
                      { (() => {
                        const nonMatchDetails = report.details.filter(item => item.anomaly !== 'Match');
                        return nonMatchDetails.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-hover" style={{ fontSize: '13px' }}>
                              <thead style={{ backgroundColor: '#f1f3f5' }}>
                                <tr>
                                  <th>Policy Number</th>
                                  <th>Client Name</th>
                                  <th>Frequency</th>
                                  <th>Agent</th>
                                  <th>Strike(Outlook)</th>
                                  <th>Strike(DB)</th>
                                  <th>Anomaly</th>
                                </tr>
                              </thead>
                              <tbody>
                                {nonMatchDetails.map((item, idx) => (
                                  <tr key={idx}>
                                    <td><strong>{item.policyNumber}</strong></td>
                                    <td>{item.clientName}</td>
                                    <td>{item.frequency}</td>
                                    <td>{item.agentName || '—'}</td>
                                    <td>{item.strikeDayOutlook ?? 'N/A'}</td>
                                    <td>{item.strikeDayDb ?? 'N/A'}</td>
                                    <td>{getAnomalyBadge(item.anomaly)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-success">All policies match – no discrepancies found.</p>
                        );
                      })() }

                      {/* Subject to Review Section */}
                      {report.subjectToReviewItems.length > 0 && (
                        <div className="mt-4">
                          <h6 className="text-warning">
                            <AlertTriangle size={16} className="me-1" />
                            Subject to Review (Non-Monthly Policies)
                          </h6>
                          <p className="text-muted" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                            ⚠️ <strong>Note:</strong> Inception date was used to estimate the strike date for these non-monthly policies. 
                            Please verify manually.
                          </p>
                          <div className="table-responsive">
                            <table className="table table-sm" style={{ fontSize: '12px' }}>
                              <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                  <th>Policy Number</th>
                                  <th>Client Name</th>
                                  <th>Frequency</th>
                                  <th>Agent</th>
                                  <th>Inception Date</th>
                                  <th>Estimated Strike Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.subjectToReviewItems.map((item, idx) => (
                                  <tr key={idx}>
                                    <td><strong>{item.policyNumber}</strong></td>
                                    <td>{item.clientName}</td>
                                    <td>{item.frequency}</td>
                                    <td>{item.agentName || '—'}</td>
                                    <td>{item.inceptionDate || 'N/A'}</td>
                                    <td>{item.estimatedDate || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
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

export default AdminOutlook;
