import { WebSocketServer } from "ws";

export const wss = new WebSocketServer({ port: 3001 });

export function broadcast(uploadId: string, data: any) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ uploadId, ...data }));
  });
}