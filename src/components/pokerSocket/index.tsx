import { useEffect } from 'react'
import styles from './styles.module.scss'
import { getSocket } from '@/lib/socket'

export default function pokerSocket(userId: string) {

    useEffect(() => {
        const socket = getSocket()

        socket.auth = { userId }
        socket.connect()

        return () => {
            socket.disconnect()
        }
    }, [userId])
    return (
        <></>
    )
}