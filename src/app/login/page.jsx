"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  // Bypass login screen if user session exists in local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user_name");
      if (storedName) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  // Detect user's timezone automatically
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch (e) {
      console.warn("Timezone detection failed, using UTC fallback");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    const payload = isLogin
      ? { email, password }
      : { name, email, password, timezone };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || "Something went wrong. Please check your inputs.");
      }

      // Store name and email in local storage for layout rendering
      if (result.success && result.data?.user) {
        localStorage.setItem("user_name", result.data.user.name);
        localStorage.setItem("user_email", result.data.user.email);
      }

      // If login/signup successful, redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 shadow-2xl relative z-10 py-2">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20 mb-3">
            <Sparkles className="h-6 w-6 text-violet-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {isLogin
              ? "Sign in to connect with your AI Mentor"
              : "Start tracking goals, journals, and roadmaps"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="bg-zinc-900/60 border-zinc-800 text-zinc-100 focus-visible:ring-violet-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-900/60 border-zinc-800 text-zinc-100 focus-visible:ring-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-zinc-900/60 border-zinc-800 text-zinc-100 focus-visible:ring-violet-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <span>Detected Timezone:</span>
                <Badge variant="outline" className="text-zinc-300 border-zinc-700 bg-zinc-800/40 font-mono">
                  {timezone}
                </Badge>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-zinc-100 font-medium py-5 mt-2 transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400 border-t border-zinc-800/80 pt-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-violet-400 font-medium hover:underline hover:text-violet-300 transition-colors ml-1"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}