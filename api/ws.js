export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.headers.get("upgrade") === "websocket") {
    const url = new URL(req.url);
    const room = url.searchParams.get("room") || "default";
    const { socket, response } = Deno.upgradeWebSocket(req);
    if (!global.clients) global.clients = new Map();
    if (!global.clients.has(room)) global.clients.set(room, new Set());
    const roomClients = global.clients.get(room);
    roomClients.add(socket);
    socket.onmessage = (event) => {
      roomClients.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(event.data);
        }
      });
    };
    socket.onclose = () => {
      roomClients.delete(socket);
      if (roomClients.size === 0) global.clients.delete(room);
    };
    return response;
  }
  return new Response("WebSocket server running", { status: 200 });
}
