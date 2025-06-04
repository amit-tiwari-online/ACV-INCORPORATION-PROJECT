import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import TicketModal from "@/components/ticket-modal";
import ReportModal from "@/components/report-modal";
import TicketsTable from "@/components/tickets-table";
import ReportsTable from "@/components/reports-table";
import { exportToExcel } from "@/lib/excel";
import type { Ticket, Report } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [globalSearch, setGlobalSearch] = useState("");
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [ticketsTableOpen, setTicketsTableOpen] = useState(false);
  const [reportsTableOpen, setReportsTableOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Fetch tickets
  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ["/api/tickets"],
    enabled: !!user,
  });

  // Fetch reports
  const { data: reports = [], refetch: refetchReports } = useQuery({
    queryKey: ["/api/reports"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const handleGlobalSearch = (query: string) => {
    setGlobalSearch(query);
    // Filter tickets and reports based on search query
    // This would be implemented based on specific requirements
  };

  const handleTicketAction = (action: string, ticket?: Ticket) => {
    switch (action) {
      case "new":
        setEditingTicket(null);
        setTicketModalOpen(true);
        break;
      case "edit":
        setEditingTicket(ticket || null);
        setTicketModalOpen(true);
        break;
      case "view":
        setTicketsTableOpen(true);
        break;
    }
  };

  const handleReportAction = (action: string, report?: Report) => {
    switch (action) {
      case "new":
        setEditingReport(null);
        setReportModalOpen(true);
        break;
      case "edit":
        setEditingReport(report || null);
        setReportModalOpen(true);
        break;
      case "view":
        setReportsTableOpen(true);
        break;
    }
  };

  const handleExportTickets = async () => {
    try {
      await exportToExcel(tickets, "tickets", "ACV_Tickets");
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

  const handleExportReports = async () => {
    try {
      await exportToExcel(reports, "reports", "ACV_Reports");
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

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t: Ticket) => t.ticketStatus === "Open").length,
    inProgress: tickets.filter((t: Ticket) => t.ticketStatus === "In Progress").length,
    closed: tickets.filter((t: Ticket) => t.ticketStatus === "Closed").length,
  };

  const reportStats = {
    total: reports.length,
    thisMonth: reports.filter((r: Report) => {
      const reportDate = new Date(r.date || "");
      const currentMonth = new Date().getMonth();
      return reportDate.getMonth() === currentMonth;
    }).reduce((sum: number, r: Report) => sum + (r.totalKm || 0), 0),
    totalAmount: reports.reduce((sum: number, r: Report) => sum + parseFloat(r.amount || "0"), 0),
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center">
                <i className="fas fa-building text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ACV Incorporation</h1>
                <p className="text-sm text-gray-500">Management Portal</p>
              </div>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search tickets or reports..."
                  value={globalSearch}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  className="w-full pl-10"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.userId}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <i className="fas fa-sign-out-alt"></i>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="p-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>Dashboard</li>
            <li><i className="fas fa-chevron-right text-xs"></i></li>
            <li className="text-gray-900">Overview</li>
          </ol>
        </nav>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Complaint Register Section */}
          <Card className="shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 text-red-600 w-10 h-10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Complaint Register</CardTitle>
                    <p className="text-sm text-gray-500">Manage service tickets and complaints</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{ticketStats.total}</div>
                  <div className="text-xs text-gray-500">Total Tickets</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  onClick={() => handleTicketAction("new")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <i className="fas fa-plus mr-2"></i>New Ticket
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTicketAction("view")}
                >
                  <i className="fas fa-list mr-2"></i>View Tickets
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{ticketStats.open}</div>
                  <div className="text-xs text-red-700">Open</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{ticketStats.inProgress}</div>
                  <div className="text-xs text-yellow-700">In Progress</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{ticketStats.closed}</div>
                  <div className="text-xs text-green-700">Closed</div>
                </div>
              </div>

              {/* Recent Tickets */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Tickets</h3>
                <div className="space-y-2">
                  {tickets.slice(0, 3).map((ticket: Ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.ticketNo}</div>
                          <div className="text-xs text-gray-500">{ticket.siteName}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(ticket.date || "").toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {tickets.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No tickets found. Create your first ticket to get started.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Reports Section */}
          <Card className="shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Daily Reports</CardTitle>
                    <p className="text-sm text-gray-500">Track daily activities and expenses</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{reportStats.total}</div>
                  <div className="text-xs text-gray-500">Total Reports</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  onClick={() => handleReportAction("new")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <i className="fas fa-plus mr-2"></i>New Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReportAction("view")}
                >
                  <i className="fas fa-list mr-2"></i>View Reports
                </Button>
              </div>

              {/* Monthly Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{reportStats.thisMonth}</div>
                  <div className="text-xs text-blue-700">KM This Month</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">₹{reportStats.totalAmount.toFixed(2)}</div>
                  <div className="text-xs text-green-700">Total Amount</div>
                </div>
              </div>

              {/* Recent Reports */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Reports</h3>
                <div className="space-y-2">
                  {reports.slice(0, 3).map((report: Report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                          <i className="fas fa-user text-xs"></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                          <div className="text-xs text-gray-500">
                            {report.totalKm} KM • ₹{report.amount}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(report.date || "").toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No reports found. Create your first report to get started.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Bar */}
        <Card className="mt-6 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleExportTickets}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  <i className="fas fa-download mr-2"></i>Export Tickets
                </Button>
                <Button
                  onClick={handleExportReports}
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                >
                  <i className="fas fa-download mr-2"></i>Export Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => {
          setTicketModalOpen(false);
          setEditingTicket(null);
        }}
        ticket={editingTicket}
        onSuccess={() => {
          refetchTickets();
          setTicketModalOpen(false);
          setEditingTicket(null);
        }}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setEditingReport(null);
        }}
        report={editingReport}
        onSuccess={() => {
          refetchReports();
          setReportModalOpen(false);
          setEditingReport(null);
        }}
      />

      <TicketsTable
        isOpen={ticketsTableOpen}
        onClose={() => setTicketsTableOpen(false)}
        onEdit={(ticket) => {
          setEditingTicket(ticket);
          setTicketModalOpen(true);
          setTicketsTableOpen(false);
        }}
        onRefresh={refetchTickets}
      />

      <ReportsTable
        isOpen={reportsTableOpen}
        onClose={() => setReportsTableOpen(false)}
        onEdit={(report) => {
          setEditingReport(report);
          setReportModalOpen(true);
          setReportsTableOpen(false);
        }}
        onRefresh={refetchReports}
      />
    </div>
  );
}
