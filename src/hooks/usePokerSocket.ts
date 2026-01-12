import { useEffect } from "react"
import { getSocket } from "@/lib/socket"

export function usePokerSocket(userId: string) {
    useEffect(() => {
        const socket = getSocket()

        socket.auth = { userId }
        socket.connect()

        return () => {
            socket.disconnect()
        }
    }, [userId])
}
