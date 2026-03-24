import { useEffect, useState } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../lib/api.js';
import { AuthContext } from './auth-context.js';

const AUTH_STORAGE_KEYS = ['print-it-auth', 'print-it-admin-auth'];

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return {
      token: '',
      user: null,
    };
  }

  try {
    const rawValue = AUTH_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
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
          AUTH_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
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
      AUTH_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      return;
    }

    AUTH_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.setItem(AUTH_STORAGE_KEYS[0], JSON.stringify(nextState));
  };

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    const nextState = {
      token: response.token,
      user: response.user,
    };

    persistAuth(nextState);
    return response.user;
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
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
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        logout,
        register,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
