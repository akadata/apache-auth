import extend from 'deep-extend';

/**
 * TODO
 *
 * @param ctx
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function middleware(ctx, req, res, next) {
  res.success = (data = {}) => {
    return res.send(extend({
      success: true
    }, data));
  };

  const defaultErrorMessage = 'There was an error completing the request.';
  res.error = (statusCode = 500, message = defaultErrorMessage, data = {}) => {
    res.status(statusCode);
    return res.send(extend({
      success: false,
      message
    }, data));
  };

  return next();
}

export default middleware;
