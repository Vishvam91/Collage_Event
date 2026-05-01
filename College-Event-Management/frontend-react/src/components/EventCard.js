import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventAPI } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import TeamRegistrationModal from './TeamRegistrationModal';

const EventCard = ({ event, onEventUpdate }) => {
  const { user, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is registered for this event
  const isRegistered = () => {
    if (!user || !event.registeredStudents) return false;
    
    if (event.isTeamEvent) {
      // Check if user is in any team
      return event.teams?.some(team => 
        team.members.some(member => member._id === user.id)
      );
    } else {
      // Check individual registration
      return event.registeredStudents.some(student => student._id === user.id);
    }
  };

  // Get user's team if registered in team event
  const getUserTeam = () => {
    if (!event.isTeamEvent || !event.teams) return null;
    return event.teams.find(team => 
      team.members.some(member => member._id === user.id)
    );
  };

  // Handle individual registration
  const handleRegister = async () => {
    if (!isAuthenticated()) {
      toast.error('Please login first');
      return;
    }

    setLoading(true);
    try {
      await eventAPI.registerForEvent(event._id);
      toast.success('Successfully registered for event!');
      if (onEventUpdate) onEventUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  // Handle team registration
  const handleTeamRegister = () => {
    if (!isAuthenticated()) {
      toast.error('Please login first');
      return;
    }
    setShowTeamModal(true);
  };

  // Handle team registration success
  const handleTeamRegistrationSuccess = () => {
    if (onEventUpdate) onEventUpdate();
  };

  // Handle unregistration
  const handleUnregister = async () => {
    if (!window.confirm('Are you sure you want to unregister from this event?')) {
      return;
    }

    setLoading(true);
    try {
      await eventAPI.unregisterFromEvent(event._id);
      toast.success('Successfully unregistered from event!');
      if (onEventUpdate) onEventUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unregistration failed');
    }
    setLoading(false);
  };

  // Format date and time
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'upcoming': return '#28a745';
      case 'registration-closed': return '#ffc107';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#17a2b8';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'upcoming': return 'Open for Registration';
      case 'registration-closed': return 'Registration Closed';
      case 'completed': return 'Event Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const userTeam = getUserTeam();
  const registered = isRegistered();
  
  // Calculate seats left based on event type
  const seatsLeft = event.isTeamEvent 
    ? event.seatLimit - (event.teams?.length || 0) 
    : event.seatLimit - (event.registeredStudents?.length || 0);

  return (
    <>
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
          📅 {formatDate(event.date)} at {event.time}<br/>
          📍 {event.venue}<br/>
          👥 {event.isTeamEvent 
            ? `${event.teams?.length || 0}/${event.seatLimit} teams registered`
            : `${event.registeredStudents?.length || 0}/${event.seatLimit} registered`
          }<br/>
          {event.isTeamEvent && <span>🏆 Team Event (Size: {event.teamSize})</span>}
        </div>
        
        <div className="event-description">
          {event.description.length > 100 
            ? `${event.description.substring(0, 100)}...` 
            : event.description
          }
        </div>
        
        <div style={{ 
          color: getStatusColor(event.status), 
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          {getStatusText(event.status)}
        </div>

        {/* Registration Info for Team Events */}
        {registered && event.isTeamEvent && userTeam && (
          <div style={{ 
            background: '#e8f5e8', 
            padding: '10px', 
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <strong>Team: {userTeam.name}</strong><br/>
            <small>
              Members: {userTeam.members.map(m => m.name).join(', ')}
            </small>
          </div>
        )}
        
        <div className="event-actions">
          <button 
            className="btn" 
            onClick={() => setShowModal(true)}
          >
            View Details
          </button>
          
          {user?.role === 'student' && event.status === 'upcoming' && (
            <>
              {!registered ? (
                // Show appropriate registration button based on event type
                event.isTeamEvent ? (
                  <button 
                    className="btn btn-success" 
                    onClick={handleTeamRegister}
                    disabled={loading || seatsLeft <= 0}
                  >
                    {loading ? 'Loading...' : 'Register Team'}
                  </button>
                ) : (
                  <button 
                    className="btn btn-success" 
                    onClick={handleRegister}
                    disabled={loading || seatsLeft <= 0}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                )
              ) : (
                <button 
                  className="btn btn-danger" 
                  onClick={handleUnregister}
                  disabled={loading}
                >
                  {loading ? 'Unregistering...' : 'Unregister'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={event.title}
      >
        <div>
          {event.imageUrl && (
            <img 
              src={`http://localhost:5000${event.imageUrl}`} 
              alt={event.title}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }}
            />
          )}
          
          <div className="event-category" style={{ marginBottom: '15px' }}>
            {event.category}
          </div>
          
          <div className="event-meta" style={{ marginBottom: '15px' }}>
            📅 <strong>Date:</strong> {formatDate(event.date)}<br/>
            🕐 <strong>Time:</strong> {event.time}<br/>
            📍 <strong>Venue:</strong> {event.venue}<br/>
            👥 <strong>Registrations:</strong> {event.isTeamEvent 
              ? `${event.teams?.length || 0}/${event.seatLimit} teams`
              : `${event.registeredStudents?.length || 0}/${event.seatLimit} students`
            }<br/>
            🎯 <strong>Eligibility:</strong> {event.eligibility}<br/>
            {event.isTeamEvent && <span>🏆 <strong>Team Size:</strong> {event.teamSize} members</span>}
          </div>
          
          <div style={{ 
            color: getStatusColor(event.status), 
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            Status: {getStatusText(event.status)}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Description:</strong>
            <p style={{ marginTop: '10px', lineHeight: '1.6' }}>
              {event.description}
            </p>
          </div>

          {/* Registration Info for Team Events */}
          {registered && event.isTeamEvent && userTeam && (
            <div style={{ 
              background: '#e8f5e8', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4>Your Team: {userTeam.name}</h4>
              <p>Members:</p>
              <ul>
                {userTeam.members.map((member, index) => (
                  <li key={index}>
                    {member.name} ({member.email})
                    {member._id === userTeam.leader && ' - Team Leader'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {user?.role === 'student' && event.status === 'upcoming' && (
            <div className="flex gap-10">
              {!registered ? (
                // Show appropriate registration button based on event type
                event.isTeamEvent ? (
                  <button 
                    className="btn btn-success" 
                    onClick={() => {
                      setShowModal(false);
                      handleTeamRegister();
                    }}
                    disabled={loading || seatsLeft <= 0}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Loading...' : 'Register Team'}
                  </button>
                ) : (
                  <button 
                    className="btn btn-success" 
                    onClick={() => {
                      setShowModal(false);
                      handleRegister();
                    }}
                    disabled={loading || seatsLeft <= 0}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Registering...' : 'Register Now'}
                  </button>
                )
              ) : (
                <button 
                  className="btn btn-danger" 
                  onClick={() => {
                    setShowModal(false);
                    handleUnregister();
                  }}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Unregistering...' : 'Unregister'}
                </button>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Team Registration Modal */}
      <TeamRegistrationModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        event={event}
        onSuccess={handleTeamRegistrationSuccess}
      />
    </>
  );
};

export default EventCard;
