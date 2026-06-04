import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useRef, useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";
import axios from "axios";
import MobileNumberDialog from "../components/MobileNumberDialog";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [mobileDialogError, setMobileDialogError] = useState("");
  const [isSavingMobile, setIsSavingMobile] = useState(false);
  const SOUTH_STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];

  const login = async (userdata) => {
    const residentialState = await getResidentialState();
    const normalizedUser = userdata
      ? {
          ...userdata,
          id: userdata.id || userdata._id,
          residentialState: residentialState || userdata?.residentialState || "Unknown",
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
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const saveMobileNumber = async (mobile) => {
    if (!user?.id) {
      setMobileDialogError("Unable to save mobile number right now.");
      return;
    }

    try {
      setIsSavingMobile(true);
      setMobileDialogError("");
      const response = await axiosInstance.patch(`/user/update/${user.id}`, { mobile });
      login(response.data);
      setIsMobileDialogOpen(false);
    } catch (error) {
      console.error("Error saving mobile number:", error);
      setMobileDialogError("Failed to save mobile number. Please try again.");
    } finally {
      setIsSavingMobile(false);
    }
  };

  const handleMobileDialogOpenChange = (nextOpen) => {
    if (!nextOpen && !user?.mobile) {
      setMobileDialogError("Please enter your mobile number to continue.");
      return;
    }
    setIsMobileDialogOpen(nextOpen);
  };

  const getResidentialState = async () => {
    try{
      const response = await axios.get("/api/location/state");
      // await axiosInstance.post("/state", { state: response.data.state });
      return response.data.state;

    }catch(error){
      console.error("Error fetching residential state:", error);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
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
          if (response.status === 201 && !response.data.result?.mobile) {
            setIsMobileDialogOpen(true);
          }
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
      <MobileNumberDialog
        open={isMobileDialogOpen}
        onOpenChange={handleMobileDialogOpenChange}
        onSubmit={saveMobileNumber}
        loading={isSavingMobile}
        error={mobileDialogError}
        mandatory={!user?.mobile}
      />
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
