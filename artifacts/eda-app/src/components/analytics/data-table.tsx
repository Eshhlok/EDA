import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  columns: string[];
  rows: Record<string, any>[];
};

export default function DataTable({
  columns,
  rows,
}: Props) {

  if (!rows.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 overflow-auto max-h-[500px]">

      <Table>

        <TableHeader className="sticky top-0 bg-background z-10">

          <TableRow>

            {columns.map((col) => (

              <TableHead
                key={col}
                className="whitespace-nowrap"
              >
                {col}
              </TableHead>

            ))}

          </TableRow>

        </TableHeader>

        <TableBody>

          {rows.map((row, index) => (

            <TableRow key={index}>

              {columns.map((col) => (

                <TableCell
                  key={col}
                  className="whitespace-nowrap font-mono text-xs"
                >

                  {typeof row[col] === "number"
                    ? row[col].toLocaleString()
                    : String(row[col])}

                </TableCell>

              ))}

            </TableRow>

          ))}

        </TableBody>

      </Table>

    </div>
  );
}