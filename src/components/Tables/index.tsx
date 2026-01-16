import { TableList } from '@/@types/tableList'
import styles from './styles.module.scss'

interface ComponentProps {
    table: TableList
    join: (t: string) => void
    index: number
}
export default function TableCard({ table, join, index }: ComponentProps) {
    return (
        <div className={styles.container}>
            <div className={styles.info}>
                <div className={styles.title}>
                    <h5>Mesa nº</h5>
                    <p>{index + 1}</p>
                </div>
                <div className={styles.phase}>
                    <h5>Fase</h5>
                    <p>{table.phase}</p>
                </div>
                <div className={styles.players}>
                    <h5>Jogadores na mesa</h5>
                    <p>{table.players}</p>
                </div>
            </div>
            {table.canJoin &&
                <div className={styles.buttonContainer}>
                    <button onClick={() => join(table.tableId)}>Entrar</button>
                </div>
            }
        </div>
    )
}