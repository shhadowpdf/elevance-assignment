import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";
import OtpPromptDialog from "../components/OtpPromptDialog";
import axios from "axios";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpMethod, setOtpMethod] = useState("email");
  const [otpTarget, setOtpTarget] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [pendingAuthUser, setPendingAuthUser] = useState(null);
  const SOUTH_STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];

  const maskMobile = (mobile) => {
    if (!mobile) return "your mobile";
    return mobile.replace(/.(?=.{2})/g, "*");
  };

  const maskEmail = (email) => {
    if (!email) return "your email";
    const [local, domain] = email.split("@");
    const maskedLocal = local.length > 2 ? `${local[0]}${"*".repeat(local.length - 2)}${local.slice(-1)}` : local;
    return `${maskedLocal}@${domain}`;
  };

  const decideOtpMethod = (userdata) => {
    if (SOUTH_STATES.includes(userdata.residentialState)) {
      return "email";
    }
    return "mobile";
  };

  const formatOtpTarget = (method, userdata) => {
    if (method === "mobile") {
      return maskMobile(userdata.mobile);
    }
    return maskEmail(userdata.email);
  };
  const finalizeLogin = async (method, user) => {
    try {
      const res = await axiosInstance.post("/user/send-otp", {
        method,
        target: method === "mobile" ? user.mobile : user.email,
        user
      })
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  }
  const login = async (userdata) => {
    const state = await getResidentialState();
    const normalizedUser = userdata
      ? {
        ...userdata,
        id: userdata.id || userdata._id,
        residentialState: state || userdata.residentialState
      }
      : null;

    if (!normalizedUser) return;

    const method = decideOtpMethod(normalizedUser);
    setOtpMethod(method);
    setOtpTarget(formatOtpTarget(method, normalizedUser));
    setPendingAuthUser(normalizedUser);
    setOtpDialogOpen(true);
    await finalizeLogin(method, normalizedUser);
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

  const verifyOtp = async (otp) => {
    if (!pendingAuthUser) return;

    if (!otp || otp.length < 6) {
      setOtpError("Please enter a valid OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const res = await axiosInstance.post("/user/verify-otp", {
        otp, target: otpMethod === "mobile" ? pendingAuthUser.mobile : pendingAuthUser.email
      });

      if (res.status === 200) {
        const verifiedUser = pendingAuthUser;

        const southUser = SOUTH_STATES.includes(verifiedUser.residentialState);

        const currentHour = new Date(
          Date.now() + 5.5 * 60 * 60 * 1000
        ).getUTCHours();

        setIsLightTheme(
          southUser &&
          currentHour >= 10 &&
          currentHour < 12
        );

        setUser(verifiedUser);

        localStorage.setItem(
          "user",
          JSON.stringify(verifiedUser)
        );

        setOtpDialogOpen(false);
        setPendingAuthUser(null);
      }
    } catch (error) {
      setOtpError(
        error.response?.data?.message ||
        "OTP verification failed. Please try again."
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const resendOtp = async () => {
    if (!pendingAuthUser) return;
    setOtpError("");
    try {
      await finalizeLogin(otpMethod, pendingAuthUser);
    } catch (error) {
      setOtpError("Failed to resend OTP. Please try again.");
    }
  };

  const getResidentialState = async () => {
    try {
      const response = await axios.get(`/api/location/state`);
      if (response.status === 200) {
        return response.data.state;
      }
    } catch (error) {
      console.error("Error fetching residential state:", error);
    }
  };


  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const restoreUser = async () => {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);

        // Get latest residential state
        const userWithState = await getResidentialState(parsedUser);

        setUser(userWithState);

        const southUser = SOUTH_STATES.includes(
          userWithState?.residentialState
        );

        const currentHour = new Date(
          Date.now() + 5.5 * 60 * 60 * 1000
        ).getUTCHours();

        setIsLightTheme(
          southUser &&
          currentHour >= 10 &&
          currentHour < 12
        );
      } catch (error) {
        console.error("Unable to read stored user:", error);
        localStorage.removeItem("user");
      }
    };

    restoreUser();
  }, []);

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        try {
          // Check if user is already stored in localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // If the stored user's email matches Firebase user's email, don't show OTP again
            if (parsedUser.email === firebaseuser.email) {
              return;
            }
          }

          const payload = {
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
          };
          const response = await axiosInstance.post("/user/login", payload);
          await login(response.data.result);
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
      <OtpPromptDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        onSubmit={verifyOtp}
        onResend={resendOtp}
        loading={isVerifyingOtp}
        error={otpError}
        method={otpMethod}
        target={otpTarget}
        mandatory={true}
      />
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
