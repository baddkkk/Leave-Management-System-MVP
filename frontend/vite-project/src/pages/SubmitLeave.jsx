import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, Send } from 'lucide-react';
import API_BASE_URL from '../lib/api';

function Toast({ message, type, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 350);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type} ${exiting ? 'toast-exit' : ''}`}>
      {type === 'success' ? (
        <CheckCircle className="toast-icon" />
      ) : (
        <svg className="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  );
}

export default function SubmitLeave({ user }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    reason: '',
    start_date: '',
    end_date: '',
    user_id: user?.id || null,
  });
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      addToast("End date must be after start date", "error");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/leave`, {
        ...form,
        email: form.email || user?.email,
      });
      setSubmitted(true);
      addToast('Leave request submitted successfully!', 'success');
      setTimeout(() => {
        setForm({ ...form, reason: '', start_date: '', end_date: '' });
        setSubmitted(false);
      }, 2000);
    } catch {
      addToast('Failed to submit leave request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto pt-12 px-6 pb-16">
        <Link
          id="back-to-dashboard"
          to="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-violet-600 mb-8 group transition-colors"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </Link>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100/80 p-10 fade-in">
          {submitted ? (
            <div className="text-center py-12 success-check">
              <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Request Submitted!</h2>
              <p className="text-gray-500">Your leave request is being reviewed.</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 id="submit-heading" className="text-3xl font-semibold text-gray-900">Request New Leave</h1>
                <p className="text-gray-500 mt-2">Fill in the details below to submit your leave request.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="fade-in stagger-1">
                  <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    id="name-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50"
                    required
                  />
                </div>

                <div className="fade-in stagger-2">
                  <label htmlFor="reason-input" className="block text-sm font-medium text-gray-700 mb-2">Why you want leave</label>
                  <textarea
                    id="reason-input"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl h-32 resize-y focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50"
                    placeholder="Tell us why you want leave. Examples: rest, family time, medical care, studies."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 fade-in stagger-3">
                  <div>
                    <label htmlFor="start-date-input" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      id="start-date-input"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="end-date-input" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      id="end-date-input"
                      type="date"
                      value={form.end_date}
                      min={form.start_date || undefined}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                <button
                  id="submit-leave-button"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-4 rounded-2xl font-medium text-lg transition-all disabled:opacity-70 shadow-lg shadow-violet-300/40 hover:shadow-violet-400/50 active:scale-[0.98] flex items-center justify-center gap-2 fade-in stagger-4"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Leave Request
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}