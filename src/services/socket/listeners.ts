import { Socket } from "socket.io-client";

export const registerListeners = (
    socket: Socket,
    handlers: {
        onListing?: (tables: any[]) => void
        onState?: (state: any) => void
        onUpdate?: (state: any) => void
        onCreated?: (table: any) => void
        onRemoved?: (id: string) => void

    }
) => {
    if (handlers.onListing)
        socket.on("table:listing", handlers.onListing)

}