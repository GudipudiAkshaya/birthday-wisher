// src/pages/Dashboard.tsx - Dashboard with stats
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { format, isSameDay, parseISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => (await api.get('/friends')).data,
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await api.get('/templates')).data,
  });

  const { data: schedulesData } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => (await api.get('/schedules')).data,
  });

  const friends = friendsData?.friends || [];
  const templates = templatesData?.templates || [];
  const schedules = schedulesData?.schedules || [];

  // Find upcoming birthdays in next 30 days
  const today = new Date();
  const upcomingBirthdays = friends
    .filter((f: any) => {
      const bday = new Date(f.birthday);
      const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      const nextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
      const upcoming = thisYear >= today ? thisYear : nextYear;
      const diff = (upcoming.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    })
    .map((f: any) => {
      const bday = new Date(f.birthday);
      const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      const upcoming = thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
      const diff = Math.ceil((upcoming.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...f, daysUntil: diff, upcomingDate: upcoming };
    })
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil);

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}! Here's what's happening.</p>
      </div>
      <div className="page-body">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{friends.length}</div>
            <div className="stat-label">Friends</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{templates.length}</div>
            <div className="stat-label">Templates</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{schedules.filter((s: any) => s.active).length}</div>
            <div className="stat-label">Active Schedules</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{upcomingBirthdays.length}</div>
            <div className="stat-label">Upcoming (30d)</div>
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>🎂 Upcoming Birthdays</h2>
            <Link to="/friends" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {upcomingBirthdays.length === 0 ? (
            <div className="card" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              No birthdays coming up in the next 30 days.{' '}
              <Link to="/friends" style={{ color: 'var(--accent)' }}>Add friends</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingBirthdays.slice(0, 5).map((f: any) => (
                <div className="item-row" key={f._id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40,
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent-glow)',
                      borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18
                    }}>🎈</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: f.daysUntil === 0 ? 'var(--success)' : 'var(--accent)' }}>
                      {f.daysUntil === 0 ? '🎉 Today!' : `In ${f.daysUntil} day${f.daysUntil === 1 ? '' : 's'}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {format(f.upcomingDate, 'MMM d')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h2>
          <div className="grid-2">
            <Link to="/friends" className="card card-interactive" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>👥</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Add Friend</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add a friend and their birthday</div>
            </Link>
            <Link to="/templates" className="card card-interactive" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>✉️</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Create Template</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Write a birthday message template</div>
            </Link>
            <Link to="/schedules" className="card card-interactive" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>📅</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Schedule a Wish</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Link a friend with a template</div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
