import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, User, LogOut, Shield, ChevronRight, Search, SlidersHorizontal, Sparkles, Bell } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../lib/api';

function StatSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="skeleton h-4 w-28 rounded-lg"></div>
          <div className="skeleton h-10 w-16 rounded-lg"></div>
        </div>
        <div className="skeleton h-12 w-12 rounded-2xl"></div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
      <div className="space-y-2 flex-1">
        <div className="skeleton h-4 w-32 rounded-lg"></div>
        <div className="skeleton h-3 w-48 rounded-lg"></div>
      </div>
      <div className="skeleton h-7 w-20 rounded-full"></div>
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const isAdmin = user?.role === 'admin';

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const fetchLeaves = useCallback(async (signal) => {
    if (signal?.aborted) return;
    setLoading(true);

    try {
      const url = isAdmin
        ? `${API_BASE_URL}/leaves`
        : `${API_BASE_URL}/leaves?email=${encodeURIComponent(user.email)}`;
      const res = await axios.get(url, { signal });
      const leaves = res.data;

      setAllLeaves(leaves);
      setStats({
        pending: leaves.filter((l) => l.status === 'pending').length,
        approved: leaves.filter((l) => l.status === 'approved').length,
        rejected: leaves.filter((l) => l.status === 'rejected').length,
      });
    } catch (err) {
      if (axios.isCancel?.(err) || err?.name === 'CanceledError') {
        return;
      }
      console.error(err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [isAdmin, user.email]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLeaves() {
      await fetchLeaves(controller.signal);
    }

    loadLeaves();
    return () => controller.abort();
  }, [fetchLeaves]);

  const filteredLeaves = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allLeaves.filter((leave) => {
      const matchesFilter = filterStatus === 'all' ? true : leave.status === filterStatus;
      const matchesSearch = !term || [leave.name, leave.reason, leave.email].some((value) =>
        String(value || '').toLowerCase().includes(term)
      );
      return matchesFilter && matchesSearch;
    });
  }, [allLeaves, filterStatus, searchTerm]);

  const handleStatusUpdate = async (leaveId, status) => {
    setActionLoading(leaveId);
    try {
      await axios.put(`${API_BASE_URL}/leave/${leaveId}/status`, { status });
      await fetchLeaves();
      addToast(`Leave request ${status === 'approved' ? 'approved' : 'rejected'} successfully.`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      addToast('Unable to update this request right now.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type} flex items-center gap-2`}>
            {toast.type === 'success' ? <CheckCircle className="toast-icon" /> : <XCircle className="toast-icon" />}
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-auto text-xs opacity-75 hover:opacity-100">×</button>
          </div>
        ))}
      </div>

      {/* Navbar */}
      <nav id="main-navbar" className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100/80 sticky top-0 z-50">
        <div className="w-full mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-300/30">
              <img src="/logo.png" alt="LeaveFlow" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">LeaveFlow</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
                {isAdmin ? (
                  <Shield className="w-4 h-4 text-violet-600" />
                ) : (
                  <User className="w-4 h-4 text-violet-600" />
                )}
              </div>
              <div className="hidden sm:block">
                <p className="font-medium text-sm text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              id="logout-button"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="w-full h-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 fade-in">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Dashboard</h2>
            <p className="text-gray-500 mt-1">
              Welcome back, <span className="font-medium text-gray-700">{user?.name}</span>. Manage your leaves, track approvals, and submit requests in one place.
            </p>
          </div>
          <Link
            id="new-leave-button"
            to="/submit"
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-violet-300/30 hover:shadow-violet-400/40 active:scale-[0.97] whitespace-nowrap"
          >
            <Calendar className="w-5 h-5" />
            New Leave Request
            <ChevronRight className="w-4 h-4 opacity-60" />
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 fade-in">
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <Sparkles className="w-4 h-4" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">Profile</p>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Welcome, {user?.name}</h3>
            <p className="text-gray-500 mt-1">{user?.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold capitalize">Role: {user?.role}</span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">Quick access enabled</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl shadow-lg shadow-violet-200/50 p-6 text-white fade-in stagger-1">
            <div className="flex items-center gap-2 text-violet-100 mb-2">
              <Bell className="w-4 h-4" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">Today</p>
            </div>
            <h3 className="text-xl font-semibold">Stay on top of leave requests</h3>
            <p className="text-violet-100 mt-2 text-sm">Use filters and search to review approvals, rejections, and pending items faster.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-100 transition-all fade-in stagger-1 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <p className="text-4xl font-semibold mt-2 text-amber-600">{stats.pending}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all fade-in stagger-2 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="text-4xl font-semibold mt-2 text-emerald-600">{stats.approved}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-100 transition-all fade-in stagger-3 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Rejected</p>
                    <p className="text-4xl font-semibold mt-2 text-red-600">{stats.rejected}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 fade-in stagger-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Recent Leave Requests</h3>
              <p className="text-sm text-gray-500">Search, filter, and review requests in one place.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <label className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or reason"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === status ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : filteredLeaves.length > 0 ? (
              filteredLeaves.map(leave => (
                <div
                  key={leave.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 truncate">{leave.name}</p>
                      {leave.start_date && leave.end_date && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {leave.start_date} → {leave.end_date}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{leave.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                      leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {leave.status}
                    </div>

                    {/* Admin approve/reject buttons */}
                    {isAdmin && leave.status === 'pending' && (
                      <div className="flex gap-1.5 ml-1">
                        <button
                          onClick={() => handleStatusUpdate(leave.id, 'approved')}
                          disabled={actionLoading === leave.id}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                          disabled={actionLoading === leave.id}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70">
                <div className="w-18 h-18 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                  <SlidersHorizontal className="w-7 h-7 text-violet-500" />
                </div>
                <p className="text-gray-700 font-semibold">No requests match this view</p>
                <p className="text-gray-500 text-sm mt-1">Try a different status filter or clear the search to see all leaves again.</p>
                <button
                  onClick={() => { setFilterStatus('all'); setSearchTerm(''); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}