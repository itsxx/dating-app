function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: {
      code,
      message: err.message || 'Internal server error',
      details: err.details
    }
  });
}

function NotFoundError(message = 'Not found') {
  this.statusCode = 404;
  this.code = 'NOT_FOUND';
  this.message = message;
}
NotFoundError.prototype = Error.prototype;

function ValidationError(message, details) {
  this.statusCode = 400;
  this.code = details?.code || 'VALIDATION_ERROR';
  this.message = message;
  this.details = details;
}
ValidationError.prototype = Error.prototype;

module.exports = {
  errorHandler,
  NotFoundError,
  ValidationError
};
