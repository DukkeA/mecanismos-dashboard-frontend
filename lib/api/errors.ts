export type BackendErrorPayload = {
  message: string;
  statusCode: number;
};

export class BackendRequestError extends Error {
  statusCode: number;

  constructor(payload: BackendErrorPayload) {
    super(payload.message);
    this.name = "BackendRequestError";
    this.statusCode = payload.statusCode;
  }
}
