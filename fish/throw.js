'use strict';

class ExtendableError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}

class HttpError extends ExtendableError {
    constructor(status, message, code) {
        super(message);
        this.status = status;
        this.code = code || -1;
    }
}

exports.HttpError = HttpError;
