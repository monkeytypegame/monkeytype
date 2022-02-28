export class MonkeyResponse {
  constructor(message, data, status = 200) {
    this.message = message;
    this.data = data ?? null;
    this.status = status;
  }
}

export function handleMonkeyResponse(handlerData, res) {
  const isMonkeyResponse = handlerData instanceof MonkeyResponse;
  const monkeyResponse = !isMonkeyResponse
    ? new MonkeyResponse("ok", handlerData)
    : handlerData;
  const { message, data, status } = monkeyResponse;

  res.status(status);
  res.monkeyMessage = message; // so that we can see message in swagger stats
  if ([301, 302].includes(status)) {
    return res.redirect(data);
  }

  res.json({ message, data });
}
