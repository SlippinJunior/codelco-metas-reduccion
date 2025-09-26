const BOM = '\uFEFF';

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function escapeCsvValue(value) {
  const normalized = normalizeValue(value);
  if (/[",\n;\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function resolveHeader(header) {
  if (typeof header === 'string') {
    return { key: header, label: header };
  }
  return header;
}

export function arrayToCsv(headers, rows, options = {}) {
  const delimiter = options.delimiter || ',';
  const includeBom = options.includeBom ?? true;
  const resolvedHeaders = headers.map(resolveHeader);
  const headerLine = resolvedHeaders.map(h => escapeCsvValue(h.label)).join(delimiter);
  const bodyLines = rows.map(row =>
    resolvedHeaders
      .map(header => escapeCsvValue(row[header.key]))
      .join(delimiter)
  );
  const csvContent = [headerLine, ...bodyLines].join('\n');
  return includeBom ? `${BOM}${csvContent}` : csvContent;
}

export function downloadFile(nombre, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nombre);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(nombre, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(nombre, blob);
  return blob;
}

export default {
  escapeCsvValue,
  arrayToCsv,
  downloadCsv,
  downloadFile
};
