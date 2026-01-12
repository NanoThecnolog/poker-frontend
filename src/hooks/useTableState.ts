'use client'

import { useEffect, useState } from "react"
import { getSocket } from "@/lib/socket"

export function useTableState() {
    const [state, setState] = useState<any>(null)

    useEffect(() => {
        const socket = getSocket()

        socket.on("table:update", setState)

        socket.on("game:showdown", result => {
            console.log("Showdown:", result)
        })

        return () => {
            socket.off("table:update", setState)
            socket.off("game:showdown")
        }
    }, [])

    return state
}
