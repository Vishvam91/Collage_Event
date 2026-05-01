import React, { useState } from 'react';
import { eventAPI } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';

const TeamRegistrationModal = ({ isOpen, onClose, event, onSuccess }) => {
  const [teamName, setTeamName] = useState('');
  const [memberEmails, setMemberEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize member emails array when modal opens
  React.useEffect(() => {
    if (isOpen && event) {
      const emailsArray = Array(event.teamSize - 1).fill('');
      setMemberEmails(emailsArray);
    }
  }, [isOpen, event]);

  // Handle email input change
  const handleEmailChange = (index, value) => {
    const newEmails = [...memberEmails];
    newEmails[index] = value;
    setMemberEmails(newEmails);
  };

  // Validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    // Validate all email addresses
    for (let i = 0; i < memberEmails.length; i++) {
      const email = memberEmails[i].trim();
      if (!email) {
        toast.error(`Please enter email for team member ${i + 1}`);
        return;
      }
      if (!isValidEmail(email)) {
        toast.error(`Please enter a valid email for team member ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      await eventAPI.registerTeam(event._id, {
        teamName: teamName.trim(),
        memberEmails: memberEmails.map(email => email.trim())
      });
      
      toast.success('Team registered successfully!');
      setTeamName('');
      setMemberEmails([]);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register team');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Register Team for: ${event.title}`}>
      <div>
        {/* Event Info */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <strong>Team Size:</strong> {event.teamSize} members (including you as team leader)<br/>
          <strong>Required:</strong> Email addresses of {event.teamSize - 1} team member(s)
        </div>

        {/* Team Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              required
            />
          </div>

          <div className="form-group">
            <label>Team Members' Email Addresses</label>
            <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
              Enter the email addresses of your team members (excluding yourself as team leader). 
              All members must be registered on the platform.
            </small>
            
            {memberEmails.map((email, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder={`Team member ${index + 1} email address`}
                  required
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Registering Team...' : 'Register Team'}
            </button>
            <button 
              type="button" 
              className="btn" 
              onClick={onClose}
              disabled={loading}
              style={{ background: '#6c757d', flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TeamRegistrationModal;
