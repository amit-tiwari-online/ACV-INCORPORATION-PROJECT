import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { exportToExcel } from "@/lib/excel";
import type { Report } from "@shared/schema";

interface ReportsTableProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (report: Report) => void;
  onRefresh: () => void;
}

export default function ReportsTable({ isOpen, onClose, onEdit, onRefresh }: ReportsTableProps) {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: "",
    fromDate: "",
    toDate: "",
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports", filters],
    enabled: isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Report Deleted",
        description: "Report has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete report.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (report: Report) => {
    if (confirm(`Are you sure you want to delete the report for ${report.name}?`)) {
      deleteMutation.mutate(report.id);
    }
  };

  const handleExport = async () => {
    try {
      await exportToExcel(reports, "reports", "ACV_Reports_Export");
      toast({
        title: "Export Successful",
        description: "Reports have been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export reports to Excel.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">All Daily Reports</DialogTitle>
              <p className="text-gray-600">View and manage daily activity reports</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700"
              >
                <i className="fas fa-download mr-2"></i>Export Excel
              </Button>
              <Button variant="outline" onClick={onClose}>
                <i className="fas fa-times mr-2"></i>Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Input
              type="date"
              placeholder="From Date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            />
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/reports"] })}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>KM In/Out</TableHead>
                  <TableHead>Total KM</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transport Mode</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No reports found. Create your first report to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report: Report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        {report.date ? new Date(report.date).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        {report.kmIn} / {report.kmOut}
                      </TableCell>
                      <TableCell>{report.totalKm}</TableCell>
                      <TableCell>₹{report.amount}</TableCell>
                      <TableCell>{report.transportMode}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(report)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(report)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination Info */}
        {reports.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-700">
              Showing {reports.length} result{reports.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
