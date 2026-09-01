class BaseError extends Error {
  constructor(m: string) {
    super(m);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * The command was not executed, but nothing is broken. Services log these and
 * return without raising a HapStatusError, so HomeKit does not show "No Response".
 */
export class IgnorableError extends BaseError {}

export class TvOfflineError extends BaseError {
  constructor() {
    super('TV is offline');
  }
}

export class TvAlreadyOnError extends IgnorableError {
  constructor() {
    super('TV is already powered on');
  }
}

export class TvAlreadyOffError extends IgnorableError {
  constructor() {
    super('TV is already powered off');
  }
}

export class TvPoweringError extends IgnorableError {
  constructor() {
    super('TV is currently transitioning states, ignoring command');
  }
}

export class SmartThingsNotAvailable extends BaseError {
  constructor() {
    super('SmartThings is not available or not configured');
  }
}
