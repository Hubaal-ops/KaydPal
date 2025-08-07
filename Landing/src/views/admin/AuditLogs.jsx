import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './AuditLogs.module.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({ search: searchTerm, page: currentPage, limit: itemsPerPage });
        const response = await fetch(`/api/protected/admin/audit-logs?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setLogs(result.data);
        } else {
          setLogs([]);
        }
      } catch (err) {
        setLogs([]);
      }
      setLoading(false);
    };
    fetchLogs();
    // eslint-disable-next-line
  }, [searchTerm, currentPage]);

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user && log.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastLog = currentPage * itemsPerPage;
  const indexOfFirstLog = indexOfLastLog - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return 'Just now';
  };

  return (
    <div className={styles.auditLogs}>
      <div className={styles.header}>
        <h1 className={styles.title}>Audit Logs</h1>
        <p className={styles.description}>
          Monitor and track all system activities and user actions.
        </p>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search logs..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <button 
          className={styles.filterButton}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          <span>Filters</span>
          {showFilters && <X size={16} />}
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading logs...</div>
      ) : (
        <div className={styles.logsContainer}>
          <table className={styles.logsTable}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Description</th>
                <th>User</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length > 0 ? (
                currentLogs.map(log => (
                  <tr key={log.id} className={styles.logRow}>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[log.status]}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{log.description}</td>
                    <td>{log.user?.email || 'System'}</td>
                    <td title={formatDate(log.timestamp)}>
                      {timeAgo(log.timestamp)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.noResults}>
                    No logs found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`${styles.pageButton} ${
                      currentPage === pageNum ? styles.active : ''
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;