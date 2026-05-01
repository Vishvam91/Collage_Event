import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, eventAPI } from '../services/api';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    registeredEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0
  });
  const [activeEvents, setActiveEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, [user, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'student') {
        // Load student dashboard data
        const response = await userAPI.getMyEvents();
        const events = response.data.events;
        
        // Separate events by status
        const active = events.filter(event => 
          event.status === 'upcoming' || event.status === 'registration-closed'
        );
        const past = events.filter(event => event.status === 'completed');
        
        setActiveEvents(active);
        setPastEvents(past);
        
        // Calculate stats
        setStats({
          totalEvents: events.length,
          registeredEvents: events.length,
          upcomingEvents: active.length,
          pastEvents: past.length
        });
        
      } else if (user?.role === 'organizer') {
        // Load organizer dashboard data
        const response = await userAPI.getMyOrganizedEvents();
        const events = response.data.events;
        
        // Separate events by status
        const active = events.filter(event => 
          event.status === 'upcoming' || event.status === 'registration-closed'
        );
        const past = events.filter(event => event.status === 'completed');
        
        setActiveEvents(active);
        setPastEvents(past);
        
        // Calculate total registrations
        const totalRegistrations = events.reduce((total, event) => 
          total + (event.registeredStudents?.length || 0), 0
        );
        
        setStats({
          totalEvents: events.length,
          registeredEvents: totalRegistrations,
          upcomingEvents: active.length,
          pastEvents: past.length
        });
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Set loading state for specific event
  const setEventLoading = (eventId, isLoading) => {
    setLoadingEvents(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(eventId);
      } else {
        newSet.delete(eventId);
      }
      return newSet;
    });
  };

  // Handle event actions for organizers
  const handleEditEvent = (eventId) => {
    navigate(`/edit-event/${eventId}`);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setEventLoading(eventId, true);
      await eventAPI.deleteEvent(eventId);
      toast.success('Event deleted successfully');
      forceRefresh(); // Force refresh dashboard
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
      console.error('Delete event error:', error);
    } finally {
      setEventLoading(eventId, false);
    }
  };

  const handleCloseRegistration = async (eventId) => {
    if (!window.confirm('Are you sure you want to close registration for this event?')) {
      return;
    }

    try {
      setEventLoading(eventId, true);
      await eventAPI.closeRegistration(eventId);
      toast.success('Registration closed successfully');
      forceRefresh(); // Force refresh dashboard
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close registration');
      console.error('Close registration error:', error);
    } finally {
      setEventLoading(eventId, false);
    }
  };

  const handleMarkComplete = async (eventId) => {
    if (!window.confirm('Are you sure you want to mark this event as completed?')) {
      return;
    }

    try {
      setEventLoading(eventId, true);
      await eventAPI.markComplete(eventId);
      toast.success('Event marked as completed');
      forceRefresh(); // Force refresh dashboard
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark event as complete');
      console.error('Mark complete error:', error);
    } finally {
      setEventLoading(eventId, false);
    }
  };

  const handleViewRegistrations = (eventId) => {
    navigate(`/event-registrations/${eventId}`);
  };

  const handleViewFeedback = (eventId) => {
    navigate(`/event-feedback/${eventId}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalEvents}</div>
          <div className="stat-label">
            {user?.role === 'student' ? 'My Events' : 'Total Events'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.registeredEvents}</div>
          <div className="stat-label">
            {user?.role === 'student' ? 'Registered Events' : 'Total Registrations'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.upcomingEvents}</div>
          <div className="stat-label">Active Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pastEvents}</div>
          <div className="stat-label">Past Events</div>
        </div>
      </div>

      {/* Student Dashboard */}
      {user?.role === 'student' && (
        <div>
          {/* Active Events */}
          <div>
            <h2>My Active Events</h2>
            {activeEvents.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                You haven't registered for any active events yet.
              </p>
            ) : (
              <div className="events-grid">
                {activeEvents.map(event => (
                  <StudentEventCard 
                    key={event._id} 
                    event={event} 
                    onEventUpdate={loadDashboard}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past Events */}
          <div style={{ marginTop: '40px' }}>
            <h2>Past Events</h2>
            {pastEvents.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No past events yet.
              </p>
            ) : (
              <div className="events-grid">
                {pastEvents.map(event => (
                  <StudentEventCard 
                    key={event._id} 
                    event={event} 
                    onEventUpdate={loadDashboard}
                    isPastEvent={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Organizer Dashboard */}
      {user?.role === 'organizer' && (
        <div>
          {/* Active Events */}
          <div>
            <h2>Active Events</h2>
            {activeEvents.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                You haven't created any active events yet.
              </p>
            ) : (
              <div className="events-grid">
                {activeEvents.map(event => (
                  <OrganizerEventCard 
                    key={event._id} 
                    event={event}
                    onEdit={() => handleEditEvent(event._id)}
                    onDelete={() => handleDeleteEvent(event._id)}
                    onCloseRegistration={() => handleCloseRegistration(event._id)}
                    onMarkComplete={() => handleMarkComplete(event._id)}
                    onViewRegistrations={() => handleViewRegistrations(event._id)}
                    loading={loadingEvents.has(event._id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past Events */}
          <div style={{ marginTop: '40px' }}>
            <h2>Past Events</h2>
            {pastEvents.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No completed events yet.
              </p>
            ) : (
              <div className="events-grid">
                {pastEvents.map(event => (
                  <OrganizerEventCard 
                    key={event._id} 
                    event={event}
                    onViewFeedback={() => handleViewFeedback(event._id)}
                    isPastEvent={true}
                    loading={loadingEvents.has(event._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Student Event Card Component
const StudentEventCard = ({ event, onEventUpdate, isPastEvent = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get user's team if it's a team event
  const getUserTeam = () => {
    if (!event.isTeamEvent || !event.teams) return null;
    return event.teams.find(team => 
      team.members.some(member => member._id === user.id)
    );
  };

  const handleSubmitFeedback = () => {
    navigate(`/submit-feedback/${event._id}`);
  };

  const userTeam = getUserTeam();

  return (
    <div className="event-card">
      <div className="event-category">{event.category}</div>
      <h3>{event.title}</h3>
      
      {event.imageUrl && (
        <img 
          src={`http://localhost:5000${event.imageUrl}`} 
          alt={event.title}
          className="event-image"
        />
      )}
      
      <div className="event-meta">
        📅 {new Date(event.date).toLocaleDateString()} at {event.time}<br/>
        📍 {event.venue}<br/>
        👥 {event.registeredStudents.length}/{event.seatLimit} registered
      </div>

      {/* Team Info */}
      {event.isTeamEvent && userTeam && (
        <div style={{ 
          background: '#e8f5e8', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>Team: {userTeam.name}</strong><br/>
          <small>Members: {userTeam.members.map(m => m.name).join(', ')}</small>
        </div>
      )}
      
      <div className="event-description">
        {event.description.length > 100 
          ? `${event.description.substring(0, 100)}...` 
          : event.description
        }
      </div>
      
      <div className="event-actions">
        {isPastEvent && (
          <button 
            className="btn btn-success" 
            onClick={handleSubmitFeedback}
          >
            Submit Feedback
          </button>
        )}
      </div>
    </div>
  );
};

// Organizer Event Card Component
const OrganizerEventCard = ({ 
  event, 
  onEdit, 
  onDelete, 
  onCloseRegistration, 
  onMarkComplete,
  onViewRegistrations,
  onViewFeedback,
  isPastEvent = false,
  loading = false
}) => {
  return (
    <div className="event-card">
      <div className="event-category">{event.category}</div>
      <h3>{event.title}</h3>
      
      {event.imageUrl && (
        <img 
          src={`http://localhost:5000${event.imageUrl}`} 
          alt={event.title}
          className="event-image"
        />
      )}
      
      <div className="event-meta">
        📅 {new Date(event.date).toLocaleDateString()} at {event.time}<br/>
        📍 {event.venue}<br/>
        👥 {event.registeredStudents.length}/{event.seatLimit} registered<br/>
        {event.isTeamEvent && <span>🏆 Team Event (Size: {event.teamSize})</span>}
      </div>
      
      <div className="event-description">
        {event.description.length > 100 
          ? `${event.description.substring(0, 100)}...` 
          : event.description
        }
      </div>
      
      <div className="event-actions">
        {isPastEvent ? (
          <button 
            className="btn" 
            onClick={onViewFeedback}
            disabled={loading}
          >
            View Feedback
          </button>
        ) : (
          <>
            <button 
              className="btn" 
              onClick={onEdit}
              disabled={loading}
            >
              Edit
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={onViewRegistrations}
              disabled={loading}
            >
              View Registrations
            </button>
            {event.status === 'upcoming' && (
              <button 
                className="btn btn-danger" 
                onClick={onCloseRegistration}
                disabled={loading}
              >
                {loading ? 'Closing...' : 'Close Registration'}
              </button>
            )}
            {event.status === 'registration-closed' && (
              <button 
                className="btn btn-success" 
                onClick={onMarkComplete}
                disabled={loading}
              >
                {loading ? 'Completing...' : 'Mark Complete'}
              </button>
            )}
            <button 
              className="btn btn-danger" 
              onClick={onDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
