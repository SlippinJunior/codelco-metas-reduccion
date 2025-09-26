import React from 'react';

const Selector = ({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  required = false,
  error,
  helpText,
  className,
  selectClassName,
  children,
  ...rest
}) => {
  const selectId = id || name;
  const helpId = helpText ? `${selectId}-help` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  const containerClasses = ['flex flex-col space-y-1', className].filter(Boolean).join(' ');
  const selectClasses = [
    'form-input appearance-none focus:outline-none focus:ring-2 focus:ring-codelco-accent',
    error ? 'border-red-500 focus:ring-red-400' : null,
    selectClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-codelco-dark">
          {label}
          {required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name || selectId}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
        className={selectClasses}
        {...rest}
      >
        {options.map(opcion => (
          <option key={opcion.value ?? opcion.id} value={opcion.value ?? opcion.id}>
            {opcion.label ?? opcion.nombre ?? opcion.texto ?? opcion.value}
          </option>
        ))}
        {children}
      </select>
      {helpText && (
        <p id={helpId} className="text-xs text-codelco-secondary">{helpText}</p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
};

export default Selector;
