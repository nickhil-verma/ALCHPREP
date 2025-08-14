"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ Next.js navigation
import { Navbar } from "@/components/ui/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

const PasswordCriteriaItem = ({ isMet, text }) => (
  <li
    className={`flex items-center gap-2 transition-colors duration-300 ${
      isMet ? "text-green-400" : "text-zinc-400"
    }`}
  >
    {isMet ? (
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 flex-shrink-0" />
    )}
    <span>{text}</span>
  </li>
);

const Login = () => {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    specialChar: false,
  });

  const isFormValid = () => {
    if (isLogin) return identifier.trim() && password.trim();
    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
    return (
      username.trim() && identifier.trim() && password.trim() && isPasswordValid
    );
  };

  useEffect(() => {
    document.title = isLogin ? "ALCHPREP Login" : "ALCHPREP Signup";
  }, [isLogin]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/app"); // ✅ Using router.push instead of navigate
  }, [router]);

  useEffect(() => {
    setPasswordCriteria({
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      specialChar: /[!@#$%^&*]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

    if (!isLogin && !isPasswordValid) {
      setErrorMsg("Password must meet all the criteria.");
      return;
    }

    const endpoint = isLogin
      ? "https://auth-universal-repo.vercel.app/api/auth/login"
      : "https://auth-universal-repo.vercel.app/api/auth/signup";

    const payload = isLogin
      ? { identifier: identifier.toLowerCase(), password }
      : { username, email: identifier.toLowerCase(), password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        let errorMessage =
          data?.error || data?.message || data.errors?.[0]?.msg || data;
        setErrorMsg(errorMessage || "An error occurred. Please try again.");
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        toast.success("Login successful!", { position: "top-center" });
        setTimeout(() => router.push("/app"), 1500); // ✅ router.push
      } else {
        toast.success("Signup successful! You can now login.", {
          position: "top-center",
        });
        setIsLogin(true);
        setIdentifier("");
        setPassword("");
        setUsername("");
        localStorage.setItem("email", identifier);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <section className="w-full min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white relative">
      <ToastContainer />
      <Navbar />
      <div className="flex flex-col items-center mt-20 justify-center min-h-[80vh] px-4">
        <div className="backdrop-blur-lg bg-white/10 border my-6 border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <h1 className="text-3xl dark:text-white text-black font-semibold text-center mb-6">
            {isLogin ? "ALCHPREP Login" : "Join ALCHPREP"}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm text-zinc-400">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    /^[a-zA-Z0-9_]*$/.test(e.target.value) &&
                    setUsername(e.target.value)
                  }
                  required
                  placeholder="john_doe"
                  className="w-full px-4 py-2  bg-gray-300 dark:bg-zinc-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-zinc-400">
                {isLogin ? "Email or Username" : "Email"}
              </label>
              <input
                type={isLogin ? "text" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="JohnDoe@gmail.com"
                className="w-full px-4 py-2 bg-gray-300 dark:bg-zinc-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsChecklistVisible(true)}
                  required
                  placeholder="Password"
                  className="w-full px-4 py-2 pr-10 bg-gray-300 dark:bg-zinc-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div
                className={`transition-all duration-500 overflow-hidden ${
                  isChecklistVisible
                    ? "max-h-40 mt-2 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-3 bg-zinc-800/80 rounded-lg text-sm">
                  <ul className="space-y-2">
                    <PasswordCriteriaItem
                      isMet={passwordCriteria.length}
                      text="At least 6 characters"
                    />
                    <PasswordCriteriaItem
                      isMet={passwordCriteria.uppercase}
                      text="One uppercase letter (A-Z)"
                    />
                    <PasswordCriteriaItem
                      isMet={passwordCriteria.specialChar}
                      text="One special character (!@#$%^&*)"
                    />
                  </ul>
                </div>
              </div>
            </div>
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <button
              type="submit"
              disabled={!isFormValid()}
              className="w-full bg-black dark:bg-white dark:text-black text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
            <p className="text-center text-sm text-zinc-400">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-blue-700 underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
