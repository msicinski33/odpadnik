export default async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Only set Content-Type for non-FormData bodies
  if (
    !(options.body instanceof FormData) &&
    !headers['Content-Type'] // allow manual override
  ) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...options, headers });
} 