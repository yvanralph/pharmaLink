// Small wrapper around fetch for talking to the PharmaLink API.

import { API_BASE } from './config.js';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(API_BASE + path, options);
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0, 'network_error');
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // not JSON - handled below
  }

  if (!response.ok) {
    throw new ApiError(
      body?.error?.message || 'Something went wrong. Please try again.',
      response.status,
      body?.error?.code || 'error',
    );
  }
  return body;
}

// GET /api/<path>?<params>. Empty, null and undefined params are left out.
export function get(path, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const queryString = query.toString();
  return request(queryString ? `${path}?${queryString}` : path);
}

export function post(path, data) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
