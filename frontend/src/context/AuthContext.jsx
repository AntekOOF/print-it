import { useEffect, useState } from 'react';
import { getCurrentUser, loginAdmin } from '../lib/api.js';
import { AuthContext } from './auth-context.js';

const AUTH_STORAGE_KEY = 'print-it-admin-auth';

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return {
      token: '',
      user: null,
    };
  }

  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : { token: '', user: null };
  } catch {
    return {
      token: '',
      user: null,
    };
  }
};

export function AuthProvider({ children }) {
  const [{ token, user }, setAuthState] = useState(readStoredAuth);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser(token);

        if (!ignore) {
          setAuthState({
            token,
            user: currentUser,
          });
        }
      } catch {
        if (!ignore) {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          setAuthState({
            token: '',
            user: null,
          });
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      ignore = true;
    };
  }, [token]);

  const persistAuth = (nextState) => {
    setAuthState(nextState);

    if (!nextState.token) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
  };

  const login = async (credentials) => {
    const response = await loginAdmin(credentials);
    const nextState = {
      token: response.token,
      user: response.user,
    };

    persistAuth(nextState);
    return response.user;
  };

  const logout = () => {
    persistAuth({
      token: '',
      user: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
