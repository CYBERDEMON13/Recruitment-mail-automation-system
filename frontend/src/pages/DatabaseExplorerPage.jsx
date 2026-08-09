import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, 
  Table, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  Layers, 
  Key, 
  Lock,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Download,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function DatabaseExplorerPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [tables, setTables] = useState([]);
  const [dbType, setDbType] = useState('sqlite');
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const limit = 25;

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchTables();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, page);
    }
  }, [selectedTable, page]);

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const res = await axios.get('/api/admin/database/tables');
      if (res.data.success) {
        setTables(res.data.tables);
        setDbType(res.data.dbType);
        if (res.data.tables.length > 0 && !selectedTable) {
          setSelectedTable(res.data.tables[0].name);
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load database tables.');
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchTableData = async (tableName, pageNum) => {
    setLoadingData(true);
    try {
      const offset = pageNum * limit;
      const res = await axios.get(`/api/admin/database/tables/${tableName}?limit=${limit}&offset=${offset}`);
      if (res.data.success) {
        setTableData(res.data.rows);
        setTotalRows(res.data.total);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load table data.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/database/backup', '_blank');
    showSuccess('Downloading full Database Snapshot Backup (.json)...');
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoring(true);
        const backupData = JSON.parse(event.target.result);
        const res = await axios.post('/api/admin/database/restore', { backup: backupData });
        if (res.data.success) {
          showSuccess(res.data.message || 'Database snapshot restored successfully!');
          fetchTables();
          if (selectedTable) fetchTableData(selectedTable, page);
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Invalid snapshot file format.');
      } finally {
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  // If Non-Admin, block access cleanly!
  if (!isAdmin) {
    return (
      <div style={{ padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '520px', textAlign: 'center', padding: '2.5rem 2rem', borderColor: 'var(--rose-300)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--rose-100)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <ShieldAlert size={32} color="var(--rose-600)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--rose-900)', marginBottom: '0.5rem' }}>
            Access Denied (403 Forbidden)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            The Master Database Explorer contains sensitive user tokens, system configurations, and raw records. Access is strictly restricted to <strong>System Administrators</strong> only.
          </p>
          <div style={{ fontSize: '0.8rem', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-app)', color: 'var(--text-muted)' }}>
            Current Logged-in User Role: <strong>{user?.role || 'Guest'}</strong>
          </div>
        </div>
      </div>
    );
  }

  const activeTableObj = tables.find(t => t.name === selectedTable);
  
  // Local Search Filter
  const filteredRows = tableData.filter(row => {
    if (!searchQuery) return true;
    return Object.values(row).some(val => 
      String(val || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Database size={28} style={{ color: 'var(--primary-600)' }} />
            Master Database Explorer Studio
          </h1>
          <p className="page-subtitle">Inspect raw SQL tables, schemas, backup snapshots & persistent storage status (Admin Authorization Active)</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadBackup}>
            <Download size={16} />
            <span>Export DB Backup</span>
          </button>
          
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={16} />
            <span>{restoring ? 'Restoring...' : 'Restore DB Snapshot'}</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} style={{ display: 'none' }} disabled={restoring} />
          </label>

          <button className="btn btn-secondary btn-sm" onClick={fetchTables} disabled={loadingTables}>
            <RefreshCw size={16} />
            <span>Refresh Schema</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Sidebar: Table Selector */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={18} color="var(--primary-600)" />
              <span>Tables ({tables.length})</span>
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
              {dbType.toUpperCase()} PERSISTENT
            </span>
          </div>

          {loadingTables ? (
            <div style={{ padding: '2rem 0', textAlign: 'center' }}>
              <div className="spinner" style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }}></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {tables.map(t => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => { setSelectedTable(t.name); setPage(0); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify.content: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selectedTable === t.name ? 'var(--primary-500)' : 'transparent',
                    background: selectedTable === t.name ? 'var(--primary-50)' : 'transparent',
                    color: selectedTable === t.name ? 'var(--primary-900)' : 'var(--text-main)',
                    fontWeight: selectedTable === t.name ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Table size={16} color={selectedTable === t.name ? 'var(--primary-600)' : 'var(--text-muted)'} />
                    <span>{t.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.15rem 0.4rem', borderRadius: '10px' }}>
                    {t.rowCount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Area: Table Schema & Data Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Table Header & Schema Summary */}
          {activeTableObj && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HardDrive size={20} color="var(--primary-600)" />
                    <span>Table: {activeTableObj.name}</span>
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Total Records: <strong>{totalRows}</strong> rows • Columns: <strong>{activeTableObj.columns.length}</strong> fields
                  </p>
                </div>

                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filter records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.825rem' }}
                  />
                </div>
              </div>

              {/* Column Schema Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {activeTableObj.columns.map(col => (
                  <span key={col.name} style={{
                    fontSize: '0.725rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: col.isPrimary ? 'var(--primary-100)' : 'var(--bg-app)',
                    border: col.isPrimary ? '1px solid var(--primary-300)' : '1px solid var(--border-color)',
                    color: col.isPrimary ? 'var(--primary-800)' : 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {col.isPrimary && <Key size={12} color="var(--primary-600)" />}
                    <strong>{col.name}</strong> ({col.type})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {loadingData ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div className="spinner" style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }}></div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading database records...</div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No records found in table <strong>{selectedTable}</strong>.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.keys(filteredRows[0] || {}).map(colName => (
                        <th key={colName} style={{ whiteSpace: 'nowrap' }}>{colName}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {Object.entries(row).map(([k, val], cIdx) => (
                          <td key={cIdx} style={{ fontSize: '0.825rem', whiteSpace: 'nowrap', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {val === null || val === undefined ? (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                            ) : typeof val === 'object' ? (
                              <code>{JSON.stringify(val)}</code>
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-surface)'
            }}>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Showing Page {page + 1} of {Math.ceil(totalRows / limit) || 1} ({totalRows} total rows)
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  disabled={(page + 1) * limit >= totalRows}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
