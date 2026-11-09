import React, { useState, useEffect } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

interface HoldTimerProps {
  initialSeconds: number;
  onExpire: () => void;
}

export const HoldTimer: React.FC<HoldTimerProps> = ({ initialSeconds, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpiringSoon = secondsLeft < 120;

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition shadow-sm ${
        isExpiringSoon
          ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
      }`}
    >
      {isExpiringSoon ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      ) : (
        <Timer className="w-3.5 h-3.5 text-emerald-600" />
      )}
      <span>
        Hold Lease: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
