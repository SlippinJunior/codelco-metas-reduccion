import React from 'react';
const CampoInput = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  error,
  helpText,
  className,
  inputClassName,
  ...rest
}) => {
  const inputId = id || name;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const containerClasses = ['flex flex-col space-y-1', className].filter(Boolean).join(' ');
  const inputClasses = [
    'form-input transition-colors focus:outline-none focus:ring-2 focus:ring-codelco-accent',
    error ? 'border-red-500 focus:ring-red-400' : null,
    inputClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-codelco-dark">
          {label}
          {required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name || inputId}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
        className={inputClasses}
        {...rest}
      />
      {helpText && (
        <p id={helpId} className="text-xs text-codelco-secondary">{helpText}</p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
};

export default CampoInput;
