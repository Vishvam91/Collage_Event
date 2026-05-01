import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const EventRegistrations = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    loadRegistrations();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getRegistrations(eventId);
      setEvent(response.data.event);
      setRegistrations(response.data.registrations);
    } catch (error) {
      toast.error('Failed to load registrations');
      console.error('Load registrations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByDepartment = (students) => {
    return students.reduce((groups, student) => {
      const dept = student.department || 'Unknown';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(student);
      return groups;
    }, {});
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

  const remainingSeats = event.seatLimit - registrations.length;
  const departmentGroups = groupByDepartment(registrations);

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Registrations for "{event.title}"</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-number">{registrations.length}</div>
            <div className="stat-label">Total Registrations</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{event.seatLimit}</div>
            <div className="stat-label">Total Seats</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{remainingSeats}</div>
            <div className="stat-label">Remaining Seats</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Object.keys(departmentGroups).length}</div>
            <div className="stat-label">Departments</div>
          </div>
        </div>

        {/* Registrations Table */}
        {registrations.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No registrations yet.
          </p>
        ) : (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Student ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Department</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Year</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((student, index) => (
                    <tr key={student._id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{student.name}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{student.email}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{student.studentId}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{student.department}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{student.year}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Department Breakdown */}
            <div style={{ marginTop: '30px' }}>
              <h3>Department Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                {Object.entries(departmentGroups).map(([department, students]) => (
                  <div key={department} className="stat-card">
                    <div className="stat-number">{students.length}</div>
                    <div className="stat-label">{department}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrations;
