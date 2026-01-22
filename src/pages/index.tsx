import Head from "next/head";
import styles from "@/styles/Home.module.scss";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { SetupAPIClient } from "@/connections/apiBackend";
import { PlayerState, TableState } from "@/@types/tableState";
import { TableList } from "@/@types/tableList";
import { nanoid } from 'nanoid'
import { parseCookies, setCookie } from 'nookies'
import TableCard from "@/components/Tables";


export default function Home() {
  //const [tableId, setTableId] = useState<string>("")
  const [tableState, setTableState] = useState<TableState | null>(null)
  const [tables, setTables] = useState<TableList[]>([])
  const [userId, setUserId] = useState<string>('')
  const [hand, setHand] = useState<string[]>([])
  const [player, setPlayer] = useState<PlayerState | null>(null)


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
      //console.log("mesas disponíveis", data)
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
  useEffect(() => {
    const player = tableState?.players.find(p => p.userId === userId)
    if (!player) return
    setPlayer(player)
  }, [tableState])

  useEffect(() => {
    //getTables()
    const socket = socketRef.current
    socket.emit("table:list")
  }, [])

  useEffect(() => {
    const socket = socketRef.current;

    socket.connect()


    socket.on("connect", () => {
      console.log("socket conectado:", socket.id)

    })

    socket.on("table:listing", (tables) => {
      console.log("recebendo table:list", tables)
      setTables(tables)
    })

    socket.on("table:state", (state) => {
      console.log("Estado inicial da mesa", state)
      setTableState(state)
      //getTables()
    })

    socket.on("table:update", (state) => {
      console.log("Atualização de estado da mesa", state)
      setTableState(state)
      //getTables()
    })
    socket.on("table:playerJoined", (state) => {
      console.log("jogador entrou na mesa", state)
      setTableState(state)
      //getTables()
    })
    socket.on("table:playerLeft", (uid) => {
      console.log("user saiu da mesa", uid)
      //getTables()
    })
    socket.on("table:created", (table) => {
      console.log("Mesa criada", table)
      //getTables()
      //setTables(prev => ({ ...prev, table }))
    })

    socket.on("table:removed", ({ tableId }: { tableId: string }) => {
      setTables(prev => prev.filter(t => t.tableId !== tableId))
    })

    socket.on("player:hand", ({ hand }: { hand: string[] }) => {
      console.log("mão do jogador", hand)
      setHand(hand)
    })

    socket.on("table:error", (err) => {
      console.error(err.message)
    })
    socket.on("player:error", (message) => {
      console.log("Erro do jogador", message)
    })
    socket.on("game:end", (result) => {
      console.log("resultado final do jogo", result)
    })

    return () => {
      socket.off("connect")
      socket.off("table:listing")
      socket.off("table:state")
      socket.off("table:update")
      socket.off("table:playerJoined")
      socket.off("table:playerLeft")
      socket.off("table:created")
      socket.off("table:removed")
      socket.off("table:error")
      socket.off("game:end")
      socket.off("player:error")
      socket.off("player:hand")
      socket.disconnect()
      console.log("socket desconectado.")
    }
  }, [])

  const createTable = async () => {//request pra rota backend, depois emite evento com deck_id
    const socket = socketRef.current;
    socket.emit("table:new")
    //socket.emit("table:created", data.deck_id)
  }

  const joinTable = async (tableId: string) => {
    const socket = socketRef.current;
    //console.log(socket)

    if (!socket.connected) return console.warn("Socket não conectado")
    //if (socket.connected) console.log("Conectado")

    console.log("Emitindo table:join", tableId)

    socket.emit("table:join", {
      tableId: tableId,
      userId: userId
    })
    //socket.emit("table:list")
  }
  const setPrepared = () => {

    setPlayer((prev) => ({ ...prev!, prepared: true }))
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
        {player &&
          <div>
            <div>
              fichas:
              {player.stack}
            </div>
          </div>
        }

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
                {
                  /*
                  <p>verificar jogadores preparados. Todos precisam estar preparados para iniciar o jogo. Adicionar botão de preparado e adicionar verificação na mesa se todos estão preparados.</p>
                <p>Parar de depender de tableState para mostrar o botão de iniciar jogo. só mostrar depois que todos os jogadores da mesa estiverem preparados.</p>
                  */
                }
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
            {
              tableState && tableState.phase === "waiting" && player &&
              <div>
                <div>
                  <button onClick={setPrepared}>Preparado</button>
                </div>
                <div className={styles.playerStatus} style={{ backgroundColor: player.prepared ? "green" : "red" }} />
              </div>
            }

            {tableState.phase === "waiting" && tableState.players.length >= 2 &&
              <div>
                <h4>Iniciar jogo</h4>
                <button onClick={startHand}>Iniciar</button>
                {tableState.players[0].prepared}
              </div>
            }
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
                      <button onClick={() => sendAction(userId, "bet", 100)}>bet</button>
                      <button onClick={() => sendAction(userId, "check")}>Check</button>
                      <button onClick={() => sendAction(userId, "raise", 30)}>raise</button>
                      <button onClick={() => sendAction(userId, "allin")}> All-in</button>
                    </div>
                  </>
                }
                {hand.length > 0 &&
                  <div className={styles.hand}>
                    {hand.map((h, i) =>
                      <img
                        key={i}
                        src={`https://deckofcardsapi.com/static/img/${h}.png`}
                        alt={`Carta ${i + 1}`}
                        className={styles.cardImage}
                      />
                    )}
                  </div>
                }
              </>
            }
            <div className={styles.cardsComunityContainer}>
              {
                tableState && tableState.communityCards.length > 0 &&
                tableState.communityCards.map((c, i) =>
                  <img
                    key={i}
                    src={`https://deckofcardsapi.com/static/img/${c}.png`}
                    alt={`Carta ${i + 1}`}
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
