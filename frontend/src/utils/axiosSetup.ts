import axios from 'axios';

/**
 * Global Axios interceptor for Examirror.in
 * Automatically attaches the correct JWT Bearer authorization header
 * based on route context (Admin, Center, or Student) to all outgoing requests.
 */

export const getAuthToken = (url?: string): string | null => {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const targetUrl = url || '';

  // 1. Admin context
  if (currentPath.startsWith('/admin') || targetUrl.includes('/api/admin')) {
    const adminToken = localStorage.getItem('adminToken') || 
                       sessionStorage.getItem('adminToken') || 
                       localStorage.getItem('admin_token');
    if (adminToken) return adminToken;
  }

  // 2. Student context
  if (currentPath.startsWith('/student') || targetUrl.includes('/api/student')) {
    const studentToken = localStorage.getItem('studentToken') || 
                         sessionStorage.getItem('studentToken');
    if (studentToken) return studentToken;
  }

  // 3. Center context (Note: Admin accessing center routes should use adminToken)
  if (currentPath.startsWith('/center') || targetUrl.includes('/api/center')) {
    if (currentPath.startsWith('/admin')) {
      const adminToken = localStorage.getItem('adminToken') || 
                         sessionStorage.getItem('adminToken') || 
                         localStorage.getItem('admin_token');
      if (adminToken) return adminToken;
    }
    const centerToken = localStorage.getItem('token') || 
                        sessionStorage.getItem('token');
    if (centerToken) return centerToken;
  }

  // 4. Fallback based on available stored tokens
  const adminToken = localStorage.getItem('adminToken') || 
                     sessionStorage.getItem('adminToken') || 
                     localStorage.getItem('admin_token');
  if (adminToken && (currentPath.startsWith('/admin') || targetUrl.includes('/api/admin'))) {
    return adminToken;
  }

  const centerToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (centerToken && (currentPath.startsWith('/center') || targetUrl.includes('/api/center'))) {
    return centerToken;
  }

  const studentToken = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');
  if (studentToken && (currentPath.startsWith('/student') || targetUrl.includes('/api/student'))) {
    return studentToken;
  }

  // If still not resolved and any token exists, return it if URL matches API pattern
  if (targetUrl.includes('/settings') && !targetUrl.includes('/center/settings')) return adminToken;
  if (targetUrl.includes('/api/admin')) return adminToken;
  if (targetUrl.includes('/api/center')) return centerToken || adminToken;
  if (targetUrl.includes('/api/student')) return studentToken;

  return null;
};

export const setupAxiosInterceptors = () => {
  // Request Interceptor
  axios.interceptors.request.use(
    (config) => {
      // If authorization header is already explicitly set, respect it
      if (config.headers && config.headers.Authorization) {
        return config;
      }

      const token = getAuthToken(config.url);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor for handling session expirations
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const url = error.config?.url || '';

        // If admin request fails with 401, redirect to admin login
        if (currentPath.startsWith('/admin') && url.includes('/api/admin')) {
          console.warn('[Auth] Admin token expired or unauthorized. Redirecting to admin login.');
          localStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminToken');
          window.location.href = '/login/admin';
        }
      }
      return Promise.reject(error);
    }
  );

  // Also hook native window.fetch so fetch('/api/admin/...') includes Authorization
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const token = getAuthToken(url);

      if (token) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init.headers = headers;
      }

      return originalFetch(input, init);
    };
  }
};
