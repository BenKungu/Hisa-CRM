import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Header from '../header';
import SidebarNav from '../sidebar';
import { searchService } from '../../services/search';
import { Users,Briefcase, UserPlus, Search as SearchIcon } from 'react-feather';

interface SearchResult {
  id: string;
  label: string;
  subtitle: string;
  type: string;
  url: string;
}

const SearchResults = () => {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    clients: SearchResult[];
    policies: SearchResult[];
    agents: SearchResult[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && q.trim().length >= 2) {
      setQuery(q);
      performSearch(q.trim());
    }
  }, [location.search]);

  const performSearch = async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await searchService.search(q);
      if (response.success) {
        setResults(response.data);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err: any) {
      setError(err.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalResults = () => {
    if (!results) return 0;
    return (results.clients?.length || 0) + 
           (results.policies?.length || 0) + 
           (results.agents?.length || 0);
  };

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">
                  Search Results for "{query}"
                  <small className="text-muted ms-2" style={{ fontSize: '14px' }}>
                    ({totalResults()} found)
                  </small>
                </h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Search</li>
                </ul>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && results && totalResults() === 0 && (
            <div className="text-center p-4">
              <SearchIcon size={48} className="text-muted" />
              <p className="text-muted mt-2">No results found for "{query}"</p>
            </div>
          )}

          {!loading && !error && results && totalResults() > 0 && (
            <div className="row">
              <div className="col-sm-12">
                {/* Clients – red strip, names green, view red */}
                {results.clients && results.clients.length > 0 && (
                  <div className="card mb-3">
                    <div className="card-header" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #c70e2a' }}>
                      <h5 className="card-title mb-0">
                        <Users size={18} className="me-1" /> Clients ({results.clients.length})
                      </h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-group list-group-flush">
                        {results.clients.map((item) => (
                          <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <Link to={item.url} style={{ fontWeight: '500', color: '#2a9d36' }}>
                                {item.label}
                              </Link>
                              <div style={{ fontSize: '12px', color: '#999' }}>{item.subtitle}</div>
                            </div>
                            <Link to={item.url} className="btn btn-sm" style={{ backgroundColor: '#c70e2a', color: '#fff', border: 'none' }}>
                              View
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Policies – green strip, numbers red, view green */}
                {results.policies && results.policies.length > 0 && (
                  <div className="card mb-3">
                    <div className="card-header" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #2a9d36' }}>
                      <h5 className="card-title mb-0">
                        <Briefcase size={18} className="me-1" /> Policies ({results.policies.length})
                      </h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-group list-group-flush">
                        {results.policies.map((item) => (
                          <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <Link to={item.url} style={{ fontWeight: '500', color: '#c70e2a' }}>
                                {item.label}
                              </Link>
                              <div style={{ fontSize: '12px', color: '#999' }}>{item.subtitle}</div>
                            </div>
                            <Link to={item.url} className="btn btn-sm" style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none' }}>
                              View
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Agents – red strip, names green, view orange */}
                {results.agents && results.agents.length > 0 && (
                  <div className="card mb-3">
                    <div className="card-header" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #c70e2a' }}>
                      <h5 className="card-title mb-0">
                        <UserPlus size={18} className="me-1" /> Agents ({results.agents.length})
                      </h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-group list-group-flush">
                        {results.agents.map((item) => (
                          <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <Link to={item.url} style={{ fontWeight: '500', color: '#2a9d36' }}>
                                {item.label}
                              </Link>
                              <div style={{ fontSize: '12px', color: '#999' }}>{item.subtitle}</div>
                            </div>
                            <Link to={item.url} className="btn btn-sm" style={{ backgroundColor: '#F15A29', color: '#fff', border: 'none' }}>
                              View
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchResults;