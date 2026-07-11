import React from 'react';
import './Table.css';

interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T, index?: number) => React.ReactNode);
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
}

export function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col, colIdx) => {
                const content =
                  typeof col.accessor === 'function'
                    ? col.accessor(row, rowIdx)
                    : (row[col.accessor] as React.ReactNode);
                return <td key={colIdx}>{content}</td>;
              })}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default Table;
