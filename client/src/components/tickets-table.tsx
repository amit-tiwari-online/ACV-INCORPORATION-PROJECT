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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { exportToExcel } from "@/lib/excel";
import type { Ticket } from "@shared/schema";

interface TicketsTableProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (ticket: Ticket) => void;
  onRefresh: () => void;
}

export default function TicketsTable({ isOpen, onClose, onEdit, onRefresh }: TicketsTableProps) {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    projectType: "",
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["/api/tickets", filters],
    enabled: isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tickets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Ticket Deleted",
        description: "Ticket has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (ticket: Ticket) => {
    if (confirm(`Are you sure you want to delete ticket ${ticket.ticketNo}?`)) {
      deleteMutation.mutate(ticket.id);
    }
  };

  const handleExport = async () => {
    try {
      await exportToExcel(tickets, "tickets", "ACV_Tickets_Export");
      toast({
        title: "Export Successful",
        description: "Tickets have been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export tickets to Excel.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">All Tickets</DialogTitle>
              <p className="text-gray-600">Manage complaint tickets</p>
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
              placeholder="Search by ticket number..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.projectType}
              onValueChange={(value) => setFilters({ ...filters, projectType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Project Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Project Types</SelectItem>
                <SelectItem value="Network Infrastructure">Network Infrastructure</SelectItem>
                <SelectItem value="Security Systems">Security Systems</SelectItem>
                <SelectItem value="Communication Systems">Communication Systems</SelectItem>
                <SelectItem value="IT Support">IT Support</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Installation">Installation</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/tickets"] })}
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
                  <TableHead>Ticket No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Project Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No tickets found. Create your first ticket to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket: Ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.ticketNo}</TableCell>
                      <TableCell>
                        {ticket.date ? new Date(ticket.date).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>{ticket.siteName}</TableCell>
                      <TableCell>{ticket.contactPerson}</TableCell>
                      <TableCell>{ticket.projectType}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.ticketStatus || "")}>
                          {ticket.ticketStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(ticket)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ticket)}
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
        {tickets.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-700">
              Showing {tickets.length} result{tickets.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
