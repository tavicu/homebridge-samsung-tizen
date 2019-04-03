class BaseError extends Error {
    constructor(message) {
        super(message);

        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}



class TvOfflineError extends BaseError {
    constructor(message) { super(message || 'TV is offline') }
}

class TvAlreadyOnlineError extends BaseError {
    constructor(message) { super(message || 'TV is already online') }
}

class TvAlreadyOfflineError extends BaseError {
    constructor(message) { super(message || 'TV is already offline') }
}



class PoweringOnlineError extends BaseError {
    constructor(message) { super(message || 'Powering on is in progress') }
}

class PoweringOfflineError extends BaseError {
    constructor(message) { super(message || 'Powering off is in progress') }
}



class InvalidAppIdError extends BaseError {
    constructor(message, appId) { super(message || `No application found with this id (${appId})`) }
}

class InvalidChannelError extends BaseError {
    constructor(message, channel) { super(message || `Invalid channel number (${channel})`) }
}

class InvalidInputTypeError extends BaseError {
    constructor(message) { super(message || 'Invalid type for input') }
}



class SocketOpenError extends BaseError {
    constructor(message, response) {
        super((message || 'Failed to open socket') + (response ? ' ' + JSON.stringify(response) : ''));

        this.response = response;
    }
}

class SocketSendError extends BaseError {
    constructor(message) { super(message || 'Failed to send request to socket') }
}

class SocketResponseError extends BaseError {
    constructor(message) { super(message) }
}



class WoLFailedError extends BaseError {
    constructor(message) { super(message || 'Failed to power on the TV') }
}

class PairFailedError extends BaseError {
    constructor(message) { super(message || `Failed to pair! Make sure TV is online and you click "Allow" on the popup`) }
}



module.exports = {
    TvOfflineError,
    TvAlreadyOnlineError,
    TvAlreadyOfflineError,

    PoweringOnlineError,
    PoweringOfflineError,

    InvalidAppIdError,
    InvalidChannelError,
    InvalidInputTypeError,

    SocketOpenError,
    SocketSendError,
    SocketResponseError,

    WoLFailedError,
    PairFailedError
};