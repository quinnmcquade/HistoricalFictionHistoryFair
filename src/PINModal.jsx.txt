import React, { useState } from "react";
import { Lock, X } from "lucide-react";

export const PINModal = ({ onPINSubmit, isOpen }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setError("PIN must contain only numbers");
      return;
    }
    onPINSubmit(pin);
    setPin("");
    setError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex justify-center">
            <div className="bg-slate-800 p-4 rounded-2xl">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              Faculty Dashboard
            </h2>
            <p className="text-sm text-slate-500">
              Enter the 4-digit PIN to access the teacher dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength="4"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                placeholder="••••"
                className="w-full p-4 text-center text-4xl font-black border-2 border-slate-200 rounded-2xl focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 outline-none tracking-widest"
              />
              {error && (
                <p className="text-red-600 text-sm font-bold mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors"
            >
              Unlock
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Students: Do not attempt
          </p>
        </div>
      </div>
    </div>
  );
};

export default PINModal;
