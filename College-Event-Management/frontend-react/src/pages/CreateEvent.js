import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import { toast } from 'react-toastify';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Cultural',
    date: '',
    time: '',
    venue: '',
    eligibility: 'All students',
    seatLimit: '',
    isTeamEvent: false,
    teamSize: 2
  });
  const [imageFile, setImageFile] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.date || 
          !formData.time || !formData.venue || !formData.seatLimit) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate team size if it's a team event
      if (formData.isTeamEvent && (formData.teamSize < 2 || formData.teamSize > 10)) {
        toast.error('Team size must be between 2 and 10');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('venue', formData.venue);
      formDataToSend.append('eligibility', formData.eligibility);
      formDataToSend.append('seatLimit', parseInt(formData.seatLimit));
      formDataToSend.append('isTeamEvent', formData.isTeamEvent);
      
      if (formData.isTeamEvent) {
        formDataToSend.append('teamSize', parseInt(formData.teamSize));
      }
      
      if (imageFile) {
        formDataToSend.append('eventImage', imageFile);
      }

      await eventAPI.createEvent(formDataToSend);
      toast.success('Event created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create event';
      toast.error(message);
    }
    
    setLoading(false);
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1>Create New Event</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Enter event description"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="Cultural">Cultural</option>
              <option value="Technical">Technical</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>Time *</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Venue *</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="Enter venue"
              required
            />
          </div>

          <div className="form-group">
            <label>Eligibility</label>
            <input
              type="text"
              name="eligibility"
              value={formData.eligibility}
              onChange={handleChange}
              placeholder="Who can participate?"
            />
          </div>

          <div className="form-group">
            <label>Seat Limit *</label>
            <input
              type="number"
              name="seatLimit"
              value={formData.seatLimit}
              onChange={handleChange}
              placeholder="Maximum participants"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="isTeamEvent"
                checked={formData.isTeamEvent}
                onChange={handleChange}
              />
              Team Event
            </label>
            <small style={{ color: '#666' }}>Check if this is a team-based event</small>
          </div>

          {formData.isTeamEvent && (
            <div className="form-group">
              <label>Team Size *</label>
              <input
                type="number"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleChange}
                placeholder="Number of members per team"
                min="2"
                max="10"
                required
              />
              <small style={{ color: '#666' }}>Number of students per team (2-10)</small>
            </div>
          )}

          <div className="form-group">
            <label>Event Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <small style={{ color: '#666' }}>Upload an image file (JPG, PNG, GIF). Max size: 5MB</small>
          </div>

          <div className="flex gap-10">
            <button 
              type="submit" 
              className="btn"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
            
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
