import { getSocket } from "@/lib/socket";

export class Table {

    static joinTable(tableId: string) {
        const socket = getSocket()
        socket.emit("table:join", { tableId })
    }

    tableState() {

    }


}