import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import {
  Terminal,
  Database,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Table as TableIcon,
  Layers,
  ChevronRight,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';

export function DatabaseLab() {
  const { dbStatus } = usePlayer();
  const { addNotification } = useNotification();

  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('ddl');
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [search, setSearch] = useState('');

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getLabCategories();
      if (res.success) {
        setCategories(res.data || []);
        if (res.data?.length > 0) {
          const firstCat = res.data[0];
          setSelectedCatId(firstCat.id);
          if (firstCat.queries?.length > 0) {
            setSelectedQueryId(firstCat.queries[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load lab categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const activeCategory = categories.find((c) => c.id === selectedCatId);
  const activeQuery = activeCategory?.queries?.find((q) => q.id === selectedQueryId) || activeCategory?.queries?.[0];

  const handleExecute = async () => {
    if (!activeQuery) return;
    try {
      setExecuting(true);
      setQueryResult(null);
      const res = await api.executeLabQuery(activeQuery.id);
      setQueryResult(res);
      if (res.success) {
        addNotification(`Query executed successfully: ${res.rowCount ?? 0} records returned.`, 'success');
      } else {
        addNotification(res.error || 'Execution encountered error.', 'error');
      }
    } catch (err) {
      setQueryResult({ success: false, error: err.message });
      addNotification(err.message, 'error');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, color: 'var(--accent-olive)', letterSpacing: '0.06em' }}>
              RELATIONAL SCHEMA // SQL EXECUTION LAB
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              DATABASE DIAGNOSTICS & TELEMETRY
            </span>
          </div>

          <h1 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: 0 }}>
            DATABASE LAB
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>
            Direct interactive relational query laboratory for inspecting SQL queries, joins, transactions, views, and schema constraints.
          </p>
        </div>

        {/* Engine Status Pill */}
        <div
          className="tactical-panel"
          style={{
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <Database size={16} color="var(--accent-olive)" />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACTIVE ENGINE</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
              {dbStatus.engine || 'MySQL / MariaDB'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Category Selector + Query Explorer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) minmax(400px, 1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Left: Category Navigation */}
        <div className="tactical-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)' }}>
            LABORATORY SECTIONS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {categories.map((c) => {
              const isSelected = c.id === selectedCatId;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCatId(c.id);
                    if (c.queries?.length > 0) {
                      setSelectedQueryId(c.queries[0].id);
                    }
                    setQueryResult(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    borderLeft: isSelected ? '3px solid var(--accent-olive)' : '3px solid transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{c.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {c.queries?.length || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Query & Execution Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Query Selection Dropdown / Pills */}
          {activeCategory && activeCategory.queries && (
            <div className="tactical-panel" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                SELECT QUERY IN THIS MODULE
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {activeCategory.queries.map((q) => {
                  const isQSelected = q.id === (activeQuery?.id || selectedQueryId);
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setSelectedQueryId(q.id);
                        setQueryResult(null);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: isQSelected ? 'rgba(163, 179, 107, 0.15)' : 'var(--bg-surface)',
                        border: isQSelected ? '1px solid var(--accent-olive)' : '1px solid var(--border-dim)',
                        color: isQSelected ? 'var(--accent-olive)' : 'var(--text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: isQSelected ? 700 : 500,
                      }}
                    >
                      {q.title}
                    </button>
                  );
                })}
              </div>

              {activeQuery && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 12, marginBottom: 0 }}>
                  {activeQuery.description}
                </p>
              )}
            </div>
          )}

          {/* SQL Editor / Viewer */}
          <div className="tactical-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={16} color="var(--accent-olive)" />
                <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                  SQL STATEMENT
                </h3>
              </div>

              <button
                onClick={handleExecute}
                disabled={executing || !activeQuery?.executable}
                className="tactical-btn tactical-btn-olive"
                style={{ padding: '6px 16px', fontSize: '12px' }}
              >
                {executing ? (
                  <>
                    <RefreshCw size={13} className="spin" />
                    EXECUTING...
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    EXECUTE QUERY
                  </>
                )}
              </button>
            </div>

            <pre
              style={{
                padding: '16px',
                backgroundColor: '#0c0f13',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#E8EDF2',
                overflowX: 'auto',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {activeQuery?.sql || '-- Select a query from the category list.'}
            </pre>
          </div>

          {/* Query Execution Result Table */}
          {queryResult && (
            <div className="tactical-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TableIcon size={16} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                    EXECUTION RESULT
                  </h3>
                </div>

                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: queryResult.success ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {queryResult.success ? `${queryResult.rowCount ?? 0} ROWS RETURNED` : 'EXECUTION FAILED'}
                </span>
              </div>

              {queryResult.success && queryResult.data && queryResult.data.length > 0 ? (
                <div style={{ overflowX: 'auto', maxHeight: '380px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)' }}>
                        {Object.keys(queryResult.data[0]).map((key) => (
                          <th key={key} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} style={{ padding: '8px 10px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                              {val === null || val === undefined ? (
                                <span style={{ color: 'var(--text-muted)' }}>NULL</span>
                              ) : typeof val === 'boolean' ? (
                                String(val)
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : queryResult.success ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>
                  Statement executed with 0 records returned (DDL / Mutation completed successfully).
                </div>
              ) : (
                <div style={{ padding: '12px', backgroundColor: 'rgba(227, 93, 93, 0.1)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-xs)', color: 'var(--color-error)', fontSize: '12px' }}>
                  <strong>Error:</strong> {queryResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DatabaseLab;
