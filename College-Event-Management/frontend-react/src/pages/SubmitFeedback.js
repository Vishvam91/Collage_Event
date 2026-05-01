import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const SubmitFeedback = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadEvent();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEvent(eventId);
      setEvent(response.data.event);
    } catch (error) {
      toast.error('Failed to load event details');
      console.error('Load event error:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please provide your feedback comment');
      return;
    }

    setSubmitLoading(true);
    try {
      await eventAPI.submitFeedback(eventId, {
        rating: parseInt(rating),
        comment: comment.trim()
      });
      
      toast.success('Feedback submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit feedback';
      toast.error(message);
    }
    setSubmitLoading(false);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '2rem',
            color: starValue <= rating ? '#ffc107' : '#e9ecef',
            cursor: 'pointer',
            padding: '0 2px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#ffc107'}
          onMouseLeave={(e) => e.target.style.color = starValue <= rating ? '#ffc107' : '#e9ecef'}
        >
          ★
        </button>
      );
    });
  };

  if (loading) {
    return <Loading />;
  }

  if (!event) {
    return (
      <div className="container">
        <div className="text-center">
          <h2>Event not found</h2>
          <button className="btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1>Submit Feedback</h1>
        
        {/* Event Details */}
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
          <h3>{event.title}</h3>
          <div style={{ color: '#666', marginTop: '10px' }}>
            📅 {new Date(event.date).toLocaleDateString()} at {event.time}<br/>
            📍 {event.venue}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rating (1-5 stars) *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
              {renderStars()}
              {rating > 0 && (
                <span style={{ marginLeft: '10px', color: '#666' }}>
                  {rating}/5 stars
                </span>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>Your Feedback *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience, what you liked, suggestions for improvement..."
              style={{ height: '120px', resize: 'vertical' }}
              required
            />
          </div>
          
          <div className="flex gap-10">
            <button 
              type="submit" 
              className="btn"
              disabled={submitLoading}
              style={{ flex: 1 }}
            >
              {submitLoading ? 'Submitting...' : 'Submit Feedback'}
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

export default SubmitFeedback;
