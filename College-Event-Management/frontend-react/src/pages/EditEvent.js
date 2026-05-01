import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const EditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
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
  const [currentImage, setCurrentImage] = useState('');

  useEffect(() => {
    loadEvent();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEvent(eventId);
      const event = response.data.event;
      
      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        date: event.date.split('T')[0], // Format date for input
        time: event.time,
        venue: event.venue,
        eligibility: event.eligibility,
        seatLimit: event.seatLimit,
        isTeamEvent: event.isTeamEvent || false,
        teamSize: event.teamSize || 2
      });
      
      setCurrentImage(event.imageUrl || '');
    } catch (error) {
      toast.error('Failed to load event details');
      console.error('Load event error:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

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
    setSubmitLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.date || 
          !formData.time || !formData.venue || !formData.seatLimit) {
        toast.error('Please fill in all required fields');
        setSubmitLoading(false);
        return;
      }

      // Validate team size if it's a team event
      if (formData.isTeamEvent && (formData.teamSize < 2 || formData.teamSize > 10)) {
        toast.error('Team size must be between 2 and 10');
        setSubmitLoading(false);
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

      await eventAPI.updateEvent(eventId, formDataToSend);
      toast.success('Event updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update event';
      toast.error(message);
    }
    
    setSubmitLoading(false);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1>Edit Event</h1>
        
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
            {currentImage && (
              <div style={{ marginBottom: '10px' }}>
                <img 
                  src={`http://localhost:5000${currentImage}`} 
                  alt="Current event"
                  style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <p style={{ fontSize: '0.9rem', color: '#666' }}>Current image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <small style={{ color: '#666' }}>
              Upload new image file (JPG, PNG, GIF). Max size: 5MB. Leave empty to keep current image.
            </small>
          </div>

          <div className="flex gap-10">
            <button 
              type="submit" 
              className="btn"
              disabled={submitLoading}
              style={{ flex: 1 }}
            >
              {submitLoading ? 'Updating Event...' : 'Update Event'}
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

export default EditEvent;
