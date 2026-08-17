import React, { useId } from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const generatedId = useId();

  return (
    <div className={`flex flex-col w-full text-left mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={generatedId}
          className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        id={generatedId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${generatedId}-error` : undefined}
        className={`px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
            : 'border-slate-200 focus:border-emerald-500'
        }`}
        {...props}
      />
      {error && (
        <span
          id={`${generatedId}-error`}
          className="text-xs font-semibold text-rose-500 mt-1.5"
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
