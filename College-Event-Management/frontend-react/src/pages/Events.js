import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import EventCard from '../components/EventCard';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load events when component mounts
  useEffect(() => {
    loadEvents();
  }, []);

  // Filter events when filter changes
  useEffect(() => {
    filterEvents();
  }, [events, categoryFilter, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all events
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAllEvents();
      setEvents(response.data.events);
    } catch (error) {
      toast.error('Failed to load events');
      console.error('Load events error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on category and search term
  const filterEvents = () => {
    let filtered = events;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  // Handle category filter change
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle event update (refresh events)
  const handleEventUpdate = () => {
    loadEvents();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container">
      <h1>College Events</h1>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Category Filter */}
        <div className="form-group" style={{ minWidth: '200px', margin: 0 }}>
          <label>Filter by Category</label>
          <select value={categoryFilter} onChange={handleCategoryChange}>
            <option value="all">All Categories</option>
            <option value="Cultural">Cultural</option>
            <option value="Technical">Technical</option>
            <option value="Sports">Sports</option>
            <option value="Workshop">Workshop</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Search */}
        <div className="form-group" style={{ minWidth: '250px', margin: 0 }}>
          <label>Search Events</label>
          <input
            type="text"
            placeholder="Search by title, description, or venue..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Events Count */}
      <div style={{ marginBottom: '20px', color: '#666' }}>
        Showing {filteredEvents.length} of {events.length} events
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          {events.length === 0 ? (
            <div>
              <h3>No events available</h3>
              <p>Check back later for new events!</p>
            </div>
          ) : (
            <div>
              <h3>No events found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <EventCard 
              key={event._id} 
              event={event} 
              onEventUpdate={handleEventUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
