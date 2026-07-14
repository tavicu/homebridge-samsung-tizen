class BaseError extends Error {
  constructor(m: string) {
    super(m);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class TvOfflineError extends BaseError {
  constructor() {
    super('TV is offline');
  }
}

export class SmartThingsNotAvailable extends BaseError {
  constructor() {
    super('SmartThings is not available or not configured');
  }
}
