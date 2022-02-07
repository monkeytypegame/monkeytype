class MonkeyResponse {
  constructor(status, message, data) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

function handleResponse(request, response, next) {
  var resBody = response.encryptedBody || response.body || {};
  var { status } = resBody;
  var handler =
    [301, 302].indexOf(status) > -1 ? _redirectResponse : _sendResponse;
  handler(request, response, next);
}

function _sendResponse(request, response) {
  var resBody = response.encryptedBody || response.body || {};
  var { status, message, data } = resBody;

  if (!resBody || !status) {
    resBody = new MonkeyResponse(500, "Response Data Not Found!");
  }

  return response.status(resBody.status).json({ message, data });
}

function _redirectResponse(request, response) {
  var resBody = response.encryptedBody || response.body || {};
  var { status, data } = resBody;
  return response.status(status).redirect(data);
}

module.exports = {
  MonkeyResponse,
  handleResponse,
};
