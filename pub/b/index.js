// ../rpc/packages/pcall/dist/src/ws/server.ts
var webSocketHandler = function(io) {
  return {
    open(ws) {
      io.addClient(ws);
      io.trigger("connection", ws.data.id);
    },
    close(ws) {
      io.getClient(ws.data.id).trigger("disconnect");
      io.removeClient(ws.data.id);
    },
    message(ws, data) {
      const socket = io.getClient(ws.data.id);
      const message = JSON.parse(data);
      const payload = parse(message);
      socket.trigger(message.event, ...payload);
    }
  };
};
function parse(message) {
  return message.payload.map((item) => {
    if (!parser[item.type]) {
      throw new Error(`Unknown type: ${item.type}`);
    }
    return parser[item.type](item.value);
  });
}

class SocketServer {
  events = new Map;
  clients = new Map;
  channels = new Map;
  websocket = webSocketHandler(this);
  on(event, handler) {
    this.events.set(event, handler);
  }
  trigger(event, id) {
    const handler = this.events.get(event);
    if (!handler) {
      throw new Error(`No handler for event: ${event}`);
    }
    handler(this.getClient(id));
  }
  emit(event, data) {
    this.clients.forEach((socket) => socket.emit(event, data));
  }
  addClient(ws) {
    this.clients.set(ws.data.id, new Socket(ws, this));
  }
  getClient(id) {
    if (!this.clients.has(id)) {
      throw new Error(`No client with id: ${id}`);
    }
    return this.clients.get(id);
  }
  removeClient(id) {
    this.clients.delete(id);
  }
  addChannel(id, context) {
    this.channels.set(id, {
      sockets: new Set,
      context,
      emit: (event, data) => this.broadcast(id, event, data)
    });
  }
  getChannel(id) {
    if (!this.channels.has(id)) {
      throw new Error(`No no channel with id: ${id}`);
    }
    return this.channels.get(id);
  }
  removeChannel(id) {
    this.channels.delete(id);
  }
  join(channelId, socket) {
    if (!this.channels.has(channelId)) {
      this.addChannel(channelId, null);
    }
    this.channels.get(channelId).sockets.add(socket);
  }
  leave(channelId, socket) {
    this.getChannel(channelId).sockets.delete(socket);
  }
  broadcast(channelId, event, data, socketId) {
    this.getChannel(channelId).sockets.forEach((socket) => {
      if (socket.id === socketId)
        return;
      socket.emit(event, data);
    });
  }
}

class Socket {
  id;
  io;
  ws;
  events = new Map;
  constructor(ws, io) {
    this.id = ws.data.id;
    this.io = io;
    this.ws = ws;
  }
  on(event, handler) {
    this.events.set(event, handler);
  }
  emit(event, ...payload) {
    this.ws.send(JSON.stringify({ event, payload }));
  }
  trigger(event, ...data) {
    const handler = this.events.get(event);
    if (!handler) {
      throw new Error(`No handler for event: ${event}`);
    }
    handler(...data);
  }
  join(channelId) {
    this.io.join(channelId, this);
  }
  leave(channelId) {
    this.io.leave(channelId, this);
  }
  broadcast(channelId, event, data) {
    this.io.broadcast(channelId, event, data, this.id);
  }
}
var parser = {
  object: JSON.parse,
  literal: (val2) => val2,
  function: (val) => eval(`(${val})`)
};
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

// ../rpc/packages/pcall/dist/src/ws/client.ts
var parse2 = function(values) {
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
      const handler = this.events.get(message.event);
      if (!handler) {
        throw new Error(`Event ${message.event} not found`);
      }
      handler(...message.payload);
    };
    this.ws.onerror = (err) => {
      console.error(err);
    };
  }
  emit(event, ...args) {
    if (!this.connected) {
      throw new Error("Socket is not open");
    }
    const payload = parse2(args);
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
// app/browser/index.mjs
var ws2 = new SocketClient("ws://localhost:6969/ws");
ws2.on("connect", () => {
  console.log("Connected");
  ws2.on("reload", () => {
    console.log("Reloading");
    location.reload();
  });
});
