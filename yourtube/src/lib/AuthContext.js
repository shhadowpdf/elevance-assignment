import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLightTheme, setIsLightTheme] = useState(false);

  const login = (userdata) => {
    const normalizedUser = userdata
      ? {
          ...userdata,
          id: userdata.id || userdata._id,
        }
      : null;

    setUser(normalizedUser);

    if (normalizedUser) {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    }
  };
  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      };
      const response = await axiosInstance.post("/user/login", payload);
      login(response.data.result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return;
    }

    try {
      login(JSON.parse(storedUser));
    } catch (error) {
      console.error("Unable to read stored user:", error);
      localStorage.removeItem("user");
    }
  }, []);

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        try {
          const payload = {
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
          };
          const response = await axiosInstance.post("/user/login", payload);
          login(response.data.result);
        } catch (error) {
          console.error(error);
          logout();
        }
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, handlegooglesignin, isLightTheme }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
