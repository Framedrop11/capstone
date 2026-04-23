const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}/api${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export const authApi = {
  login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
  me: () => fetchAPI('/auth/me'),
};

export const loanApi = {
  apply: (data) => fetchAPI('/loan/apply', { method: 'POST', body: JSON.stringify(data) }),
  shadow: (data) => fetchAPI('/loan/shadow', { method: 'POST', body: JSON.stringify(data) }),
  whatif: (data) => fetchAPI('/loan/whatif', { method: 'POST', body: JSON.stringify(data) }),
  fight: (data) => fetchAPI('/loan/fight', { method: 'POST', body: JSON.stringify(data) }),
  history: () => fetchAPI('/loan/history'),
};