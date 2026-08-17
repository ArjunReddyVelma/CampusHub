import React from 'react';

const LoadingSpinner = ({ fullScreen = false, size = 'md' }) => {
  const spinnerSizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const spinnerClass = spinnerSizes[size] || spinnerSizes.md;

  const spinnerElement = (
    <div className="flex flex-col items-center justify-center">
      <div className={`${spinnerClass} rounded-full border-t-emerald-600 border-slate-200 animate-spin`}></div>
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        <div className="text-center">
          {spinnerElement}
          <p className="mt-4 text-sm font-semibold text-slate-600">CampusHub is preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;
