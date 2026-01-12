import Head from 'next/head'
import styles from './styles.module.scss'
import { usePokerSocket } from '@/hooks/usePokerSocket'
import { useTableState } from '@/hooks/useTableState'
import { Table } from '@/services/actions/table'
import { Player } from '@/services/actions/player'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'


export default function TablePage() {
    const router = useRouter()
    const { tableId } = router.query

    const userId = "player-1"

    usePokerSocket(userId)

    const table = useTableState()

    if (!tableId) return null

    return (
        <>
            <Head>
                <title>Pagina da Mesa</title>
                <meta name='description' content='' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
            </Head>
            <main className={styles.container}>
                <button onClick={() => Table.joinTable(tableId as string)}>Entrar</button>
                <div>
                    <pre>{JSON.stringify(table, null, 2)}</pre>

                    <button onClick={() => Player.playerAction(tableId as string, userId, "check")}>Check</button>
                    <button onClick={() => Player.playerAction(tableId as string, userId, "call")}>Call</button>
                    <button onClick={() => Player.playerAction(tableId as string, userId, "raise", 100)}>Raise</button>
                    <button onClick={() => Player.playerAction(tableId as string, userId, "fold")}>Fold</button>
                </div>
            </main>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {

    return {
        props: {}
    }
}