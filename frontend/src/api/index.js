import api from './client';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }),
  me: () => api.get('/auth/me'),
};

// ── Boards ────────────────────────────────────────────────────────────────────
export const boardsApi = {
  create: (data) => api.post('/boards', data),
  mine: () => api.get('/boards/mine'),
  bySlug: (slug) => api.get(`/boards/slug/${slug}`),
  byId: (id) => api.get(`/boards/${id}`),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
  analytics: (id) => api.get(`/boards/${id}/analytics`),
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsApi = {
  list: (boardId, params) => api.get(`/boards/${boardId}/posts`, { params }),
  create: (boardId, data) => api.post(`/boards/${boardId}/posts`, data),
  get: (postId) => api.get(`/posts/${postId}`),
  updateStatus: (postId, status) => api.patch(`/posts/${postId}/status`, { status }),
  delete: (postId) => api.delete(`/posts/${postId}`),
  upvote: (postId) => api.post(`/posts/${postId}/upvote`),
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentsApi = {
  list: (postId) => api.get(`/posts/${postId}/comments`),
  create: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};
