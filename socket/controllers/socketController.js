const socketIo = require("socket.io");

let io;
const clients = new Map(); 

const SocketInstance = (server) => {
    if (!io) {
        io = socketIo(server, { cors: { origin: "*" } });

        io.on("connection", (socket) => {
            console.log(`Client connected: ${socket.id}`);

            // Store client by socket ID
            clients.set(socket.id, socket);

            io.emit("client-count", clients.size);

            socket.on("disconnect", () => {
                console.log(`Client disconnected: ${socket.id}`);
                clients.delete(socket.id);
                io.emit("client-count", clients.size);
            });
        });
    }
    return io;
};

const emitEvent = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = { SocketInstance, emitEvent };
