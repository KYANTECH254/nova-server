const socketIo = require("socket.io");
const { getPlatform, getPlatformByUrl } = require("../../actions/operations");

let io;
const clients = new Map();

const SocketInstance = (server) => {
    if (!io) {
        io = socketIo(server, { cors: { origin: "*" } });

        // Connection
        io.on("connection", (socket) => {
            clients.set(socket.id, socket);
            io.emit("client-count", clients.size);

            // Handle client data
            socket.on("client-data", async (data) => { 
                try {
                    const { platform, ip } = data;
                    const platformData = await getPlatformByUrl(platform);
                    socket.emit("platform-data", platformData);
                } catch (error) {
                    console.error(`Error fetching platform for ${data.platform}:`, error);
                    socket.emit("platform-error", { error: "Failed to get platform data" });
                }
            });
            socket.on("client-data_2", async (data) => { 
                try {
                    const { plat_id, ip } = data;
                    const platformData = await getPlatform(plat_id);
                    socket.emit("platform-data", platformData);
                } catch (error) {
                    console.error(`Error fetching platform for ${data.plat_id}:`, error);
                    socket.emit("platform-error", { error: "Failed to get platform data" });
                }
            });

            // Disconnect
            socket.on("disconnect", () => {
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
