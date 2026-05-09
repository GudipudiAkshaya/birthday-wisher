// src/pages/Templates.tsx - Birthday email templates management
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

interface Template {
  _id: string;
  name: string;
  subject: string;
  message: string;
}

const SAMPLE_TEMPLATES = [
  {
    name: '🎉 Warm & Cheerful',
    subject: 'Happy Birthday, {{name}}! 🎂',
    message: 'Hey {{name}}!\n\nWishing you a super happy birthday! 🎉🎂\n\nHope this year brings you all the joy, laughter, and success you deserve. You\'re an amazing person and I\'m so grateful to have you in my life.\n\nHave an absolutely fantastic day!\n\nWith love 💜',
  },
  {
    name: '✨ Short & Sweet',
    subject: 'Happy Birthday {{name}}! 🎈',
    message: 'Happy Birthday {{name}}! 🎈\n\nWishing you all the best on your special day. Hope it\'s as amazing as you are! 🌟\n\nCheers!',
  },
  {
    name: '🌟 Inspirational',
    subject: 'Another Year Wiser — Happy Birthday {{name}}!',
    message: 'Dear {{name}},\n\nAs you celebrate another year around the sun, may you find yourself closer to your dreams, stronger in your convictions, and surrounded by people who love and support you.\n\nHere\'s to a year filled with growth, happiness, and incredible memories.\n\nHappy Birthday! 🌟',
  },
  {
    name: '🎊 Party Vibes',
    subject: 'IT\'S YOUR BIRTHDAY {{name}}!! 🎊',
    message: '🎊 IT\'S YOUR DAY, {{name}}! 🎊\n\nTime to put on your party hat and celebrate YOU! 🎉🎂🥳\n\nYou deserve every single bit of happiness coming your way. Eat cake, dance, and enjoy every moment!\n\nHappy Birthday legend! 🙌',
  },
];

const defaultForm = { name: '', subject: '', message: '' };

const Templates: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await api.get('/templates')).data,
  });

  const templates: Template[] = data?.templates || [];

  const openAdd = (prefill?: typeof defaultForm) => {
    setEditing(null);
    setForm(prefill || defaultForm);
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, subject: t.subject, message: t.message });
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
        await api.put(`/templates/${editing._id}`, form);
        toast.success('Template updated!');
      } else {
        await api.post('/templates', form);
        toast.success('Template created!');
      }
      qc.invalidateQueries({ queryKey: ['templates'] });
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      await api.delete(`/templates/${deleteConfirm.id}`);
      toast.success('Template deleted');
      qc.invalidateQueries({ queryKey: ['templates'] });
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Templates</h1>
            <p>Create birthday message templates. Use <code style={{ background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>{'{{name}}'}</code> as a placeholder for your friend's name.</p>
          </div>
          <button className="btn btn-primary" onClick={() => openAdd()}>+ New Template</button>
        </div>
      </div>
      <div className="page-body">
        {/* Sample starters */}
        {templates.length === 0 && !isLoading && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--text-muted)' }}>Starter Templates — click to use</h2>
            <div className="grid-2">
              {SAMPLE_TEMPLATES.map((s, i) => (
                <div key={i} className="card card-interactive" style={{ cursor: 'pointer' }} onClick={() => openAdd(s)}>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {s.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="empty-state"><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--accent)' }} /></div>
        ) : templates.length === 0 ? null : (
          <div className="grid-2">
            {templates.map((t) => (
              <div key={t._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subject: {t.subject}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPreviewId(previewId === t._id ? null : t._id)}>👁️</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(t)}>✏️</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteConfirm({ id: t._id, name: t.name })}>🗑️</button>
                  </div>
                </div>
                {previewId === t._id && (
                  <div style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 14,
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                  }}>
                    {t.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, marginBottom: 24 }}>{editing ? 'Edit Template' : 'New Template'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="t-name">Template Name</label>
                <input id="t-name" className="form-input" placeholder="e.g. Warm & Cheerful" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="t-subject">Email Subject</label>
                <input id="t-subject" className="form-input" placeholder="Happy Birthday, {{name}}! 🎂" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="t-message">Message</label>
                <textarea id="t-message" className="form-input" placeholder="Write your birthday message here... Use {{name}} for the recipient's name." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={6} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Template"
        message={`Are you sure you want to delete the template "${deleteConfirm?.name}"? Any active birthday schedules using this template will stop working.`}
        confirmLabel="Delete Template"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        isLoading={loading}
        variant="danger"
      />
    </>
  );
};

export default Templates;
