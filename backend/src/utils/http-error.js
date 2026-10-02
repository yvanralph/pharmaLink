// An error that should be sent to the client with a specific HTTP status.
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
