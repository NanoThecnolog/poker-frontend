export interface TableState {
    tableId: string
    phase: "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown"
    pot: number
    communityCards: string[]
    dealerIndex: number
    turnUserId?: string
    currentBet: number
    minRaise: number
    players: {
        userId: string
        stack: number
        folded: boolean
        allIn: boolean
        isYou: boolean
        hand?: string[]
    }[]
}
