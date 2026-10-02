
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

//  login
  const login = async (email, password) => {
    const data = await api.post("/auth/login", {
      email,
      password,
    });

    console.log("Login response:", data);

    const token =
      data?.data?.token ||
      data?.token ||
      data?.accessToken ||
      data?.data?.accessToken;

    const loggedInUser =
      data?.data?.user ||
      data?.user;

    if (!token) {
      console.error(
        "Token not found in login response:",
        data
      );

      throw new Error("Token not received from server");
    }

    localStorage.setItem("token", token);

    if (loggedInUser) {
      setUser(loggedInUser);
    } else {
      await loadUser();
    }

    return data;
  };

  // register
  const register = async (userData) => {
    const data = await api.post(
      "/auth/register",
      userData
    );

    console.log("Register response:", data);

    const token =
      data?.data?.token ||
      data?.token ||
      data?.accessToken ||
      data?.data?.accessToken;

    const registeredUser =
      data?.data?.user ||
      data?.user;

    if (!token) {
      console.error(
        "Token not found in register response:",
        data
      );

      throw new Error(
        "Token not received from server"
      );
    }

    localStorage.setItem("token", token);

    if (registeredUser) {
      setUser(registeredUser);
    } else {
      await loadUser();
    }

    return data;
  };

  // logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // load current user
  const loadUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await api.get("/auth/me");

      const loggedInUser =
        data?.data?.user ||
        data?.user;

      if (!loggedInUser) {
        throw new Error("User not found");
      }

      setUser(loggedInUser);
    } catch (error) {
      console.error("Load user error:", error);

      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // refresh user
  const refreshUser = async () => {
    try {
      const data = await api.get("/auth/me");

      const loggedInUser =
        data?.data?.user ||
        data?.user;

      if (!loggedInUser) {
        return null;
      }

      setUser(loggedInUser);

      return loggedInUser;
    } catch (error) {
      console.error(
        "Refresh user error:",
        error
      );

      return null;
    }
  };

  // initial auth user
  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);