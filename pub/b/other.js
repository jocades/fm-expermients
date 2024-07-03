// ../rpc/packages/pcall/dist/src/util.ts
function isObj(value) {
  return value !== null && typeof value === "object";
}
function isFn(value) {
  return typeof value === "function";
}
function isLiteral(value) {
  return typeof value === "string" || typeof value === "number";
}

// /Users/j0rdi/dev/cel/lite/node_modules/pcall/src/ws/client.js
var parse = function(values) {
  return values.map((arg) => {
    if (isObj(arg)) {
      return { type: "object", value: JSON.stringify(arg) };
    }
    if (isFn(arg)) {
      return { type: "function", value: arg.toString() };
    }
    if (isLiteral(arg)) {
      return { type: "literal", value: arg };
    }
    throw new Error(`Unsupported type ${typeof arg} for value ${arg}`);
  });
};

class SocketClient {
  ws;
  events = new Map;
  constructor(url) {
    this.ws = new WebSocket(url);
    this.setup();
  }
  get connected() {
    return this.ws.readyState === WebSocket.OPEN;
  }
  setup() {
    this.ws.onopen = () => {
      this.events.get("connect")?.();
    };
    this.ws.onclose = () => {
      this.events.get("disconnect")?.();
    };
    this.ws.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      this.events.get(message.event)?.(...message.payload);
    };
    this.ws.onerror = (err) => {
      console.error(err);
    };
  }
  emit(event, ...args) {
    if (!this.connected) {
      throw new Error("Socket is not open");
    }
    const payload = parse(args);
    this.ws.send(JSON.stringify({ event, payload }));
  }
  on(event, callback) {
    this.events.set(event, callback);
  }
  off(event) {
    this.events.delete(event);
  }
  close() {
    this.ws.close();
  }
}

// app/browser/shared.mjs
var shared = "value";

// app/browser/other.ts
console.log(shared);
var ws = new SocketClient("ws://localhost:6969/ws");
