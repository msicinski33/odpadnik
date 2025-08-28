export default async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  
  // Ensure we use the correct base URL for API calls
  let fullUrl = url;
  if (url.startsWith('/api/')) {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.7:3000';
    fullUrl = `${baseUrl}${url}`;
  }
  
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

  return fetch(fullUrl, { ...options, headers });
} 