import Head from "next/head";
import styles from "@/styles/Home.module.scss";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { SetupAPIClient } from "@/connections/apiBackend";
import { NewTableResponse } from "@/@types/newTableResponse";
import { TableState } from "@/@types/tableState";
import { TableList } from "@/@types/tableList";
import { nanoid } from 'nanoid'
import { parseCookies, setCookie } from 'nookies'
import { Table } from "@/services/actions/table";
import TableCard from "@/components/Tables";


export default function Home() {
  //const [tableId, setTableId] = useState<string>("")
  const [deck, setDeck] = useState<NewTableResponse | null>(null)
  const [tableState, setTableState] = useState<TableState | null>(null)
  const [tables, setTables] = useState<TableList[]>([])
  const [userId, setUserId] = useState<string>('')


  //const userId = nanoid()


  const saveUserId = () => {
    const id = nanoid()
    setCookie(null, 'userId', id, {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax'
    })
    return id
  }
  const getUserId = () => {
    const cookies = parseCookies()
    return cookies.userId ?? null
  }


  const socketRef = useRef(getSocket())

  const getTables = async () => {
    const client = new SetupAPIClient()
    try {
      const { data } = await client.backend.get('/tables')
      console.log("mesas disponíveis", data)
      setTables(data)
    } catch (err) {
      console.log("Erro ao buscar tabelas ativas", err)
    }
  }

  useEffect(() => {
    const userid = getUserId()
    if (!userid) {
      const userid = saveUserId()
      setUserId(userid)
    } else setUserId(userid)
  }, [])

  /*useEffect(() => {
    getTables()
  }, [deck])*/

  useEffect(() => {
    const socket = socketRef.current;

    socket.connect()


    socket.on("connect", () => {
      console.log("socket conectado:", socket.id)
    })

    socket.on("table:state", (state) => {
      console.log("Estado inicial da mesa", state)
      setTableState(state)
    })

    socket.on("table:update", (state) => {
      console.log("Atualização de estado da mesa", state)
      setTableState(state)
    })
    socket.on("table:playerJoined", (state) => {
      console.log("jogador entrou na mesa", state)
    })
    socket.on("table:created", (table) => {
      console.log("Mesa criada", table)
      getTables()
      //setTables(prev => ({ ...prev, table }))
    })
    socket.on("table:removed", ({ tableId }) => {
      setTables(prev => prev.filter(t => t.tableId !== tableId))
    })

    socket.on("table:error", (err) => {
      console.error(err.message)
    })
    socket.on("game:end", (result) => {
      console.log("resultado final do jogo", result)
    })

    return () => {
      socket.off("connect")
      socket.off("table:state")
      socket.off("table:update")
      socket.off("table:playerJoined")
      socket.off("table:created")
      socket.off("table:removed")
      socket.off("game:end")
      socket.disconnect()
      console.log("socket desconectado.")
    }
  }, [])

  const createTable = async () => {
    const client = new SetupAPIClient()
    try {
      const { data } = await client.backend.get<NewTableResponse>('/new/table')
      const socket = socketRef.current;
      setDeck(data)
    } catch (err) {
      console.error("Erro ao entrar ou criar mesa", err)
    }
  }

  const joinTable = async (tableId: string) => {
    console.log("clicando")
    const socket = socketRef.current;
    console.log(socket)

    if (!socket.connected) return console.warn("Socket não conectado")
    if (socket.connected) console.log("Conectado")

    console.log("Emitindo table:join", tableId)

    socket.emit("table:join", {
      tableId: tableId,
      userId: userId
    })

  }
  const startHand = () => {
    const socket = socketRef.current;

    if (!socket.connected) return console.warn("Socket não conectado")

    socket.emit("table:start-hand", {
      tableId: tableState?.tableId
    })
  }

  const sendAction = (uid: string, act: string, amount?: number) => {
    const socket = socketRef.current

    if (!socket.connected) return console.warn("Socket não conectado")

    socket.emit("player:action", {
      tableId: tableState?.tableId,
      userId: uid,
      action: act,
      amount
    })
  }

  return (
    <>
      <Head>
        <title>Poker</title>
        <meta name="description" content="Um jogo de poker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.container}>

        <div>
          <h2>abrir uma mesa</h2>
          <button onClick={createTable}>Abrir mesa</button>
        </div>
        {
          tables.length > 0 &&
          <div className={styles.tableList}>
            <h3>Lista de mesas em andamento</h3>
            <div className={styles.tables}>
              {tables.map((t, i) =>
                <TableCard index={i} join={joinTable} table={t} key={i} />
              )}
            </div>
          </div>
        }

        {
          tableState &&
          <>
            <div>
              <h4>Informações sobre a mesa {tableState.tableId}</h4>
              <p>Fase atual: {tableState.phase}</p>
              <div>
                <p>Jogadores: {tableState.players.length}</p>
                <p>Aposta atual: {tableState.currentBet}</p>
                <p>Pot: {tableState.pot}</p>
                <p>minRaise: {tableState.minRaise}</p>
              </div>
            </div>
            {
              /*
              <div>
              <h4>entrar jogador 1</h4>
              <button onClick={() => joinTable(userId)}>Entrar</button>
              <h4>entrar jogador 2</h4>
              <button onClick={() => joinTable(userId)}>Entrar</button>
            </div>
               */
            }

            {tableState && tableState.phase === "waiting" && tableState.players.length >= 2 &&
              <div>
                <h4>Iniciar mão</h4>
                <button onClick={startHand}>Startar mão</button>
              </div>}
            {tableState && tableState.phase !== "waiting" &&
              <>
                <p>Fase: {tableState.phase}</p>
                <p>Pot: {tableState.pot}</p>
                {tableState.turnUserId === userId &&
                  <>
                    <h5>Turno do usuario</h5>
                    <div>
                      <button onClick={() => sendAction(userId, "fold")}>Fold</button>
                      <button onClick={() => sendAction(userId, "call")}>Call</button>
                      <button onClick={() => sendAction(userId, "bet", 10)}>bet</button>
                      <button onClick={() => sendAction(userId, "check")}>Check</button>
                    </div>
                  </>
                }
                {/*tableState.turnUserId === userId2 &&
                  <>
                    <h5>Turno do usuario 2</h5>
                    <div>
                      <button onClick={() => sendAction(userId2, "fold")}>Fold</button>
                      <button onClick={() => sendAction(userId2, "call")}>Call</button>
                      <button onClick={() => sendAction(userId2, "bet")}>bet</button>
                      <button onClick={() => sendAction(userId2, "check")}>Check</button>
                    </div>
                  </>
                */}
              </>
            }
            <div className={styles.cardsComunityContainer}>
              {
                tableState && tableState.communityCards.length > 0 &&
                tableState.communityCards.map((c, i) =>
                  <img
                    key={i}
                    src={`https://deckofcardsapi.com/static/img/${c}.png`}
                    alt={`Carta ${i}`}
                    className={styles.cardImage}
                  />

                )
              }
            </div>
          </>
        }
      </main>
    </>
  );
}
