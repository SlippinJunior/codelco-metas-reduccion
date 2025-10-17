import React from 'react';

export default function Tooltip({ children }) {
  return <span className="ml-2 text-xs text-gray-500 align-middle" title={children}>ⓘ</span>;
}
