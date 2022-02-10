export default class Observable {
  Observable() {
    this.subscribers = [];
  }

  subscribe(fn) {
    this.subscribers.push(fn);
  }

  fire(params) {
    this.subscribers.forEach((fn) => fn(params));
  }
}
