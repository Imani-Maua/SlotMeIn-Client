import styles from './DataTable.module.scss';
import Spinner from '../Spinner/Spinner';
import EmptyState from '../EmptyState/EmptyState';

/**
 * Reusable data table component
 * @param {Array} columns - Array of objects: { key, label, render (optional func) }
 * @param {Array} data - Array of row data objects
 * @param {boolean} isLoading - Shows spinner if true
 * @param {ReactNode} emptyState - Component to render if data is empty
 * @param {function} onRowClick - Optional click handler for rows
 */
export default function DataTable({ columns, data, isLoading, emptyState, onRowClick }) {
    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return emptyState || <div>No data available</div>;
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key}>{column.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={row.id || rowIndex}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={onRowClick ? styles.clickable : ''}
                        >
                            {columns.map((column) => (
                                <td key={column.key}>
                                    {column.render ? column.render(row) : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
