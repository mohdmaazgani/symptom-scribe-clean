import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleReset = async () => {
    if (!password) {
      alert("Please enter a new password");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully!");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2">
          Reset Password
        </h1>

        <p className="text-slate-400 mb-6">
          Enter your new password below.
        </p>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white p-3 mb-4 outline-none"
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white p-3 font-semibold"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;