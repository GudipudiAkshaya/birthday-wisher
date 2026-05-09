// src/pages/Friends.tsx - Friends management page
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Friend {
  _id: string;
  name: string;
  email: string;
  birthday: string;
}

const defaultForm = { name: '', email: '', birthday: '' };

const Friends: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Friend | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => (await api.get('/friends')).data,
  });

  const friends: Friend[] = data?.friends || [];

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (f: Friend) => {
    setEditing(f);
    setForm({
      name: f.name,
      email: f.email,
      birthday: f.birthday.split('T')[0],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/friends/${editing._id}`, form);
        toast.success('Friend updated!');
      } else {
        await api.post('/friends', form);
        toast.success('Friend added!');
      }
      qc.invalidateQueries({ queryKey: ['friends'] });
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? Any scheduled wishes will also be removed.`)) return;
    try {
      await api.delete(`/friends/${id}`);
      toast.success('Friend deleted');
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['schedules'] });
    } catch {
      toast.error('Failed to delete');
    }
  };

  const getBirthdayLabel = (birthday: string) => {
    const bday = new Date(birthday);
    const today = new Date();
    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    const upcoming = thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
    const diff = Math.ceil((upcoming.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '🎉 Today!';
    if (diff <= 7) return `🎂 In ${diff} days`;
    return format(new Date(birthday), 'MMM d');
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Friends</h1>
            <p>Manage your friends and their birthdays</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Friend</button>
        </div>
      </div>
      <div className="page-body">
        {isLoading ? (
          <div className="empty-state"><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--accent)' }} /></div>
        ) : friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No friends yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Add your first friend to get started</p>
            <button className="btn btn-primary" onClick={openAdd}>Add Friend</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {friends.map((f) => (
              <div className="item-row" key={f._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>🎈</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{f.email}</div>
                  </div>
                </div>
                <div className="item-row-actions">
                  <span className="badge badge-purple">{getBirthdayLabel(f.birthday)}</span>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => openEdit(f)}>✏️</button>
                  <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => handleDelete(f._id, f.name)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, marginBottom: 24 }}>{editing ? 'Edit Friend' : 'Add Friend'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="f-name">Name</label>
                <input id="f-name" className="form-input" placeholder="Arjun Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="f-email">Email</label>
                <input id="f-email" type="email" className="form-input" placeholder="arjun@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="f-birthday">Birthday</label>
                <input id="f-birthday" type="date" className="form-input" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Saving...' : editing ? 'Save Changes' : 'Add Friend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Friends;
