import React, { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [quote, setQuote] = useState('');

  const quotes = [
    "Great things take time",
    "Patience is a virtue",
    "Every moment matters",
    "Stay focused, stay calm",
    "Progress over perfection",
    "Trust the process",
    "One step at a time",
    "You've got this",
    "Almost there",
    "Good things are coming"
  ];

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-light text-slate-900">Ready</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        {/* Minimal spinner */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-900 animate-spin"></div>
          </div>
        </div>

        {/* Text */}
        <p className="text-sm font-light text-slate-600 tracking-wide">{quote}</p>
      </div>
    </div>
  );
}

