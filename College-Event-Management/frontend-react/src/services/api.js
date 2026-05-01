import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add token to requests if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions for authentication
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data)
};

// API functions for events
export const eventAPI = {
  getAllEvents: () => API.get('/events'),
  getEvent: (id) => API.get(`/events/${id}`),
  createEvent: (formData) => API.post('/events', formData),
  updateEvent: (id, formData) => API.put(`/events/${id}`, formData),
  deleteEvent: (id) => API.delete(`/events/${id}`),
  registerForEvent: (id) => API.post(`/events/${id}/register`),
  registerTeam: (id, data) => API.post(`/events/${id}/register-team`, data),
  unregisterFromEvent: (id) => API.post(`/events/${id}/unregister`),
  closeRegistration: (id) => API.put(`/events/${id}/close-registration`),
  markComplete: (id) => API.put(`/events/${id}/complete`),
  getRegistrations: (id) => API.get(`/events/${id}/registrations`),
  submitFeedback: (id, data) => API.post(`/events/${id}/feedback`, data),
  getFeedback: (id) => API.get(`/events/${id}/feedback`)
};

// API functions for users
export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  getMyEvents: () => API.get('/users/my-events'),
  getMyOrganizedEvents: () => API.get('/users/my-organized-events'),
  getAllUsers: () => API.get('/users')
};

export default API;
