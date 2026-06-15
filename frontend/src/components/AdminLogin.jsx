import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Demo credentials for admin
  const ADMIN_EMAIL = "admin@vicharanashala.com";
  const ADMIN_PASSWORD = "VicharanashalaAdmin@2026";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Store admin session
      localStorage.setItem(
        "adminSession",
        JSON.stringify({
          email,
          role: "admin",
          loginTime: new Date().toISOString(),
        })
      );
      navigate("/admin/dashboard");
    } else {
      setError("Invalid credentials. Please try again.");
      setPassword("");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-8 shadow-2xl shadow-black/50">
          {/* Background Glows */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/30 to-amber-500/20 border border-sky-500/20">
                <ShieldAlert className="h-7 w-7 text-sky-200" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-100 via-yellow-100 to-sky-100 bg-clip-text text-transparent">
                Admin Portal
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Vicharanashala System Administration
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
              >
                {error}
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Admin Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 group-focus-within:text-sky-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vicharanashala.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 py-3 pl-12 pr-4 text-white outline-none transition focus:border-sky-500/50 focus:bg-zinc-900 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 group-focus-within:text-sky-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 py-3 pl-12 pr-4 text-white outline-none transition focus:border-sky-500/50 focus:bg-zinc-900 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-500/20 to-amber-500/10 py-3 font-semibold text-white transition hover:border-sky-500/50 hover:from-sky-500/30 hover:to-amber-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  "Sign In as Admin"
                )}
              </button>
            </form>

            {/* Demo Credentials Info */}
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs text-sky-200">
              <p className="mb-2 font-semibold">Demo Admin Credentials:</p>
              <p>Email: <code className="bg-black/30 px-2 py-1 rounded">admin@vicharanashala.com</code></p>
              <p>Password: <code className="bg-black/30 px-2 py-1 rounded">VicharanashalaAdmin@2026</code></p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
