// Helpers that turn raw query-string values into validated values.
// They throw an HttpError(400) with a clear message when the input is wrong.

import { HttpError } from './http-error.js';

const isBlank = (value) => value === undefined || value === null || value === '';

export function parseId(value, name = 'id') {
  if (!/^\d{1,9}$/.test(String(value)) || Number(value) < 1) {
    throw new HttpError(400, 'invalid_parameter', `${name} must be a positive whole number`);
  }
  return Number(value);
}

export function parseInteger(value, name, { defaultValue, min = 1, max }) {
  if (isBlank(value)) return defaultValue;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || (max !== undefined && number > max)) {
    const range = max !== undefined ? `between ${min} and ${max}` : `at least ${min}`;
    throw new HttpError(400, 'invalid_parameter', `${name} must be a whole number ${range}`);
  }
  return number;
}

export function parseNumber(value, name, { defaultValue = null, min, max } = {}) {
  if (isBlank(value)) return defaultValue;
  const number = Number(value);
  if (!Number.isFinite(number) || (min !== undefined && number < min) || (max !== undefined && number > max)) {
    throw new HttpError(400, 'invalid_parameter', `${name} must be a number${min !== undefined && max !== undefined ? ` between ${min} and ${max}` : ''}`);
  }
  return number;
}

export function parseBoolean(value, name, defaultValue = null) {
  if (isBlank(value)) return defaultValue;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw new HttpError(400, 'invalid_parameter', `${name} must be true or false`);
}

export function parseChoice(value, name, choices, defaultValue) {
  if (isBlank(value)) return defaultValue;
  if (!choices.includes(value)) {
    throw new HttpError(400, 'invalid_parameter', `${name} must be one of: ${choices.join(', ')}`);
  }
  return value;
}

export function parseText(value, name, maxLength = 100) {
  if (isBlank(value)) return null;
  if (typeof value !== 'string') {
    throw new HttpError(400, 'invalid_parameter', `${name} must be a single text value`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new HttpError(400, 'invalid_parameter', `${name} must be at most ${maxLength} characters`);
  }
  return text || null;
}

// The user's location. Returns null when neither lat nor lng was sent.
export function parseLocation(query) {
  const lat = parseNumber(query.lat, 'lat', { min: -90, max: 90 });
  const lng = parseNumber(query.lng, 'lng', { min: -180, max: 180 });
  if (lat === null && lng === null) return null;
  if (lat === null || lng === null) {
    throw new HttpError(400, 'invalid_parameter', 'lat and lng must be sent together');
  }
  return { lat, lng };
}

export function parsePagination(query) {
  const page = parseInteger(query.page, 'page', { defaultValue: 1, max: 100000 });
  const limit = parseInteger(query.limit, 'limit', { defaultValue: 20, max: 100 });
  return { page, limit, offset: (page - 1) * limit };
}

export function paginationMeta({ page, limit }, total) {
  return { page, limit, total, total_pages: Math.ceil(total / limit) };
}

// Escape % and _ so user input is matched literally inside an ILIKE pattern.
export function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}
