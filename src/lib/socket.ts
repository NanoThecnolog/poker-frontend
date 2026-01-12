import { io, Socket } from "socket.io-client";



export const getSocket = () => {
    let socket: Socket | null = null
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:2121", {
            transports: ["websocket"],
            autoConnect: false
        })
    }

    return socket
}