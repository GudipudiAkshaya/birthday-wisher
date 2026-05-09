// src/pages/Schedules.tsx - Schedules management page
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Schedule {
  _id: string;
  friendId: { _id: string; name: string; email: string; birthday: string };
  templateId: { _id: string; name: string; subject: string };
  birthdayMMDD: string;
  sendTime: string;
  active: boolean;
  lastSentYear: number | null;
}

const Schedules: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ friendId: '', templateId: '', sendTime: '08:00' });

  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => (await api.get('/schedules')).data,
  });

  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => (await api.get('/friends')).data,
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await api.get('/templates')).data,
  });

  const schedules: Schedule[] = schedulesData?.schedules || [];
  const friends = friendsData?.friends || [];
  const templates = templatesData?.templates || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.friendId || !form.templateId) {
      toast.error('Please select both a friend and a template');
      return;
    }
    setLoading(true);
    try {
      await api.post('/schedules', form);
      toast.success(`Schedule created! Email will fire at ${form.sendTime} IST every birthday 🎂`);
      qc.invalidateQueries({ queryKey: ['schedules'] });
      setShowModal(false);
      setForm({ friendId: '', templateId: '', sendTime: '08:00' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await api.put(`/schedules/${id}/toggle`);
      toast.success(active ? 'Schedule paused' : 'Schedule activated');
      qc.invalidateQueries({ queryKey: ['schedules'] });
    } catch {
      toast.error('Failed to update schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success('Schedule deleted');
      qc.invalidateQueries({ queryKey: ['schedules'] });
    } catch {
      toast.error('Failed to delete');
    }
  };

  const formatBirthdayMMDD = (mmdd: string) => {
    const [mm, dd] = mmdd.split('-');
    const date = new Date(2000, parseInt(mm) - 1, parseInt(dd));
    return format(date, 'MMMM d');
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Schedules</h1>
            <p>Link friends with templates — emails fire at your chosen time every birthday</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Schedule</button>
        </div>
      </div>
      <div className="page-body">
        {isLoading ? (
          <div className="empty-state"><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--accent)' }} /></div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No schedules yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Create a schedule by linking a friend with a birthday template
            </p>
            {friends.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                First, <Link to="/friends" style={{ color: 'var(--accent)' }}>add some friends</Link>
              </p>
            ) : templates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Then, <Link to="/templates" style={{ color: 'var(--accent)' }}>create a template</Link>
              </p>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Schedule</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schedules.map((s) => (
              <div className="card" key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 48, height: 48,
                    background: s.active ? 'var(--accent-dim)' : 'var(--surface-2)',
                    border: `1px solid ${s.active ? 'var(--accent-glow)' : 'var(--border)'}`,
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>🎂</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                      {s.friendId?.name || 'Unknown Friend'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                      📧 {s.friendId?.email} · 🗓 {s.birthdayMMDD ? formatBirthdayMMDD(s.birthdayMMDD) : '—'} · ⏰ {s.sendTime || '08:00'} IST
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Template: <span style={{ color: 'var(--text)' }}>{s.templateId?.name || 'Unknown'}</span>
                      {s.lastSentYear && (
                        <span style={{ marginLeft: 10, color: 'var(--success)' }}>
                          ✅ Sent in {s.lastSentYear}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span className={`badge ${s.active ? 'badge-green' : 'badge-red'}`}>
                    {s.active ? 'Active' : 'Paused'}
                  </span>
                  <button
                    className={`toggle ${s.active ? 'on' : ''}`}
                    title={s.active ? 'Pause schedule' : 'Activate schedule'}
                    onClick={() => handleToggle(s._id, s.active)}
                  />
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>New Schedule</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
              Select a friend and a template. We'll send the email every year on their birthday.
            </p>
            {friends.length === 0 || templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                  {friends.length === 0 ? '👥 You need to add friends first.' : '✉️ You need to create templates first.'}
                </p>
                <Link
                  to={friends.length === 0 ? '/friends' : '/templates'}
                  className="btn btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  {friends.length === 0 ? 'Add Friends' : 'Create Template'}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-friend">Friend</label>
                  <select
                    id="s-friend"
                    className="form-input"
                    value={form.friendId}
                    onChange={(e) => setForm({ ...form, friendId: e.target.value })}
                    required
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">Select a friend...</option>
                    {friends.map((f: any) => (
                      <option key={f._id} value={f._id}>
                        {f.name} — {format(new Date(f.birthday), 'MMM d')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-template">Template</label>
                  <select
                    id="s-template"
                    className="form-input"
                    value={form.templateId}
                    onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                    required
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">Select a template...</option>
                    {templates.map((t: any) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-time">Send Time (IST)</label>
                  <input
                    id="s-time"
                    type="time"
                    className="form-input"
                    value={form.sendTime}
                    onChange={(e) => setForm({ ...form, sendTime: e.target.value })}
                    required
                    style={{ cursor: 'pointer' }}
                  />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    The birthday email will be sent at this exact time every year (IST).
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner" /> : null}
                    {loading ? 'Creating...' : 'Create Schedule'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Schedules;
