class MonkeyResponse {
  constructor(message, data, status = 200) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

function handleResponse(request, response, next) {
  const resBody = response.encryptedBody || response.body || {};
  const { status } = resBody;
  const handler =
    [301, 302].indexOf(status) > -1 ? _redirectResponse : _sendResponse;
  handler(request, response, next);
}

function _sendResponse(request, response) {
  let resBody = response.encryptedBody || response.body || {};
  const { status, message, data } = resBody;

  if (!resBody || !status) {
    resBody = new MonkeyResponse(500, "Response Data Not Found!");
  }

  return response.status(resBody.status).json({ message, data });
}

function _redirectResponse(request, response) {
  const resBody = response.encryptedBody || response.body || {};
  const { status, data } = resBody;
  return response.status(status).redirect(data);
}

module.exports = {
  MonkeyResponse,
  handleResponse,
};
