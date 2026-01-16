import { getSocket } from "@/lib/socket"

export class Socket {
    private socket = getSocket()
    on(event: string, func: () => {}) {
        this.socket.on(event, func)
    }

    off(event: string[]) {
        event.map(e => this.socket.off(e))
    }
}