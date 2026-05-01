import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const EventFeedback = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [feedbackData, setFeedbackData] = useState([]);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  useEffect(() => {
    loadFeedback();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getFeedback(eventId);
      setEvent(response.data.event);
      setFeedbackData(response.data.feedback);
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to load feedback');
      console.error('Load feedback error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    switch(rating) {
      case 5: return '#28a745';
      case 4: return '#6f42c1';
      case 3: return '#ffc107';
      case 2: return '#fd7e14';
      case 1: return '#dc3545';
      default: return '#6c757d';
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span 
        key={index} 
        style={{ 
          color: index < rating ? '#ffc107' : '#e9ecef',
          fontSize: '1.2rem'
        }}
      >
        ★
      </span>
    ));
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
      <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Feedback for "{event.title}"</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-number">{stats.totalFeedback}</div>
            <div className="stat-label">Total Feedback</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.averageRating.toFixed(1)}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{event.registeredStudents?.length || 0}</div>
            <div className="stat-label">Total Participants</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {event.registeredStudents?.length ? 
                Math.round((stats.totalFeedback / event.registeredStudents.length) * 100) : 0}%
            </div>
            <div className="stat-label">Response Rate</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Rating Distribution</h3>
          <div style={{ marginTop: '15px' }}>
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ minWidth: '60px' }}>{rating} stars</span>
                <div style={{ 
                  flex: 1, 
                  height: '20px', 
                  backgroundColor: '#e9ecef', 
                  borderRadius: '10px', 
                  margin: '0 15px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${stats.totalFeedback > 0 ? (stats.ratingDistribution[rating] / stats.totalFeedback) * 100 : 0}%`,
                    backgroundColor: getRatingColor(rating),
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ minWidth: '40px', textAlign: 'right' }}>
                  {stats.ratingDistribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Feedback */}
        <div>
          <h3>Individual Feedback</h3>
          {feedbackData.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No feedback submitted yet.
            </p>
          ) : (
            <div style={{ marginTop: '15px' }}>
              {feedbackData.map((feedback, index) => (
                <div key={index} style={{ 
                  border: '1px solid #e9ecef', 
                  borderRadius: '8px', 
                  padding: '20px', 
                  marginBottom: '15px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <strong>{feedback.student?.name || 'Anonymous'}</strong>
                      {feedback.student?.department && (
                        <span style={{ color: '#666', marginLeft: '10px' }}>
                          ({feedback.student.department})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>{renderStars(feedback.rating)}</div>
                      <span style={{ 
                        backgroundColor: getRatingColor(feedback.rating),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}>
                        {feedback.rating}/5
                      </span>
                    </div>
                  </div>
                  
                  <p style={{ 
                    lineHeight: '1.6', 
                    margin: '10px 0 0 0',
                    fontStyle: feedback.comment ? 'normal' : 'italic',
                    color: feedback.comment ? '#333' : '#666'
                  }}>
                    {feedback.comment || 'No comment provided'}
                  </p>
                  
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#666', 
                    marginTop: '10px',
                    textAlign: 'right'
                  }}>
                    Submitted on {new Date(feedback.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventFeedback;
