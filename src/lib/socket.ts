import { io, Socket } from "socket.io-client";

let socket: Socket | null = null

export const getSocket = () => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL
    if (!url) console.log("URL do socket não definida corretamente.")
    if (!socket) {
        socket = io(url, {
            autoConnect: false,
            transports: ["websocket"],
            auth: {
                token: "token-temporario"
            }
        })
    }

    return socket
}