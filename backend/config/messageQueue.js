class MessageQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(message) {
    this.queue.push(message);
  }

  dequeue() {
    return this.queue.shift();
  }

  process(callback) {
    const message = this.dequeue();
    if (message) {
      callback(message);
    }
  }
}

export default MessageQueue;


