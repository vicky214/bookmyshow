import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { apiClient } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loginAsCustomer: (params: { email?: string; name?: string; userId?: string }) => Promise<void>;
  loginAsAdmin: (adminKey: string, email?: string) => Promise<void>;
  loginAsPartner: (apiKey: string, apiSecret?: string) => Promise<void>;
  logout: () => void;
  switchCustomerPersona: (personaId: 'customer-alice' | 'customer-bob') => Promise<void>;
}

const DEFAULT_CUSTOMER: User = {
  id: 'customer-alice',
  name: 'Alice Johnson',
  email: 'alice@bookmyshow.com',
  role: 'CUSTOMER',
  token: 'token-cust-customer-alice'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('bms_auth_user');
      return stored ? JSON.parse(stored) : DEFAULT_CUSTOMER;
    } catch {
      return DEFAULT_CUSTOMER;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('bms_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bms_auth_user');
    }
  }, [user]);

  const loginAsCustomer = async (params: { email?: string; name?: string; userId?: string }) => {
    const res = await apiClient.customerLogin(params);
    setUser(res.user);
  };

  const loginAsAdmin = async (adminKey: string, email?: string) => {
    const res = await apiClient.adminLogin(adminKey, email);
    setUser(res.user);
  };

  const loginAsPartner = async (apiKey: string, apiSecret?: string) => {
    const res = await apiClient.partnerLogin(apiKey, apiSecret);
    setUser(res.user);
  };

  const logout = () => {
    setUser(DEFAULT_CUSTOMER);
  };

  const switchCustomerPersona = async (personaId: 'customer-alice' | 'customer-bob') => {
    await loginAsCustomer({ userId: personaId });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'CUSTOMER',
        isAuthenticated: !!user,
        loginAsCustomer,
        loginAsAdmin,
        loginAsPartner,
        logout,
        switchCustomerPersona
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
