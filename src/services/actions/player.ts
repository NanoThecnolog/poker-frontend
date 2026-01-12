import { getSocket } from "@/lib/socket";

export class Player {

    static playerAction(
        tableId: string,
        userId: string,
        action: "fold" | "call" | "raise" | "check",
        amount?: number
    ) {
        const socket = getSocket()

        socket.emit("player:action", {
            tableId,
            userId,
            action,
            amount
        })
    }
}