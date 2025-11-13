import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { FinanceEntry, deleteEntry } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";

interface FinanceTableProps {
  entries: FinanceEntry[];
  onDelete?: () => void;
}

export const FinanceTable = ({ entries, onDelete }: FinanceTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleDelete = async (entry: FinanceEntry) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    
    setDeletingId(entry.id);
    const { error } = await deleteEntry(entry.id, entry);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Entry deleted successfully");
      onDelete?.();
    }
    setDeletingId(null);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="text-center font-bold text-primary">Date</TableHead>
              <TableHead className="text-center font-bold text-primary">Project</TableHead>
              <TableHead className="text-center font-bold text-primary">Type</TableHead>
              <TableHead className="text-center font-bold text-primary">Currency</TableHead>
              <TableHead className="text-center font-bold text-primary">Location</TableHead>
              <TableHead className="text-center font-bold text-primary">Amount (SAR)</TableHead>
              <TableHead className="text-center font-bold text-primary">VAT</TableHead>
              <TableHead className="text-center font-bold text-primary">Gross</TableHead>
              <TableHead className="text-center font-bold text-primary">Status</TableHead>
              {onDelete && <TableHead className="text-center font-bold text-primary">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onDelete ? 10 : 9} className="text-center text-muted-foreground py-8">
                  No entries found
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-center">{entry.date}</TableCell>
                  <TableCell className="text-center">{entry.project_name}</TableCell>
                  <TableCell className="text-center">
                    <span className={entry.type === "income" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {entry.type === "income" ? "Income" : "Expense"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{entry.currency}</TableCell>
                  <TableCell className="text-center">{entry.location}</TableCell>
                  <TableCell className="text-center font-mono">{formatNumber(entry.amount_net)}</TableCell>
                  <TableCell className="text-center font-mono">{formatNumber(entry.vat_amount)}</TableCell>
                  <TableCell className="text-center font-mono">{formatNumber(entry.amount_gross)}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        entry.status === "مدفوع"
                          ? "bg-green-100 text-green-800"
                          : entry.status === "معلق"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </TableCell>
                  {onDelete && (
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(entry)}
                        disabled={deletingId === entry.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
