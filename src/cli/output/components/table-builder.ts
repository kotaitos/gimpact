import Table from 'cli-table3';

export interface TableConfig {
  head: string[];
  colAligns?: ('left' | 'right' | 'center')[];
}

export function createTable(config: TableConfig): Table.Table {
  return new Table({
    head: config.head,
    colAligns: config.colAligns || [],
    style: {
      head: ['cyan'],
      border: ['gray'],
    },
  });
}
