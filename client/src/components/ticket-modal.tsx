import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Ticket } from "@shared/schema";

const ticketSchema = z.object({
  date: z.string().min(1, "Date is required"),
  projectType: z.string().min(1, "Project type is required"),
  receivedBy: z.string().min(1, "Received by is required"),
  siteName: z.string().min(1, "Site name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  mobile: z.string().min(1, "Mobile number is required"),
  address: z.string().min(1, "Address is required"),
  issue: z.string().min(1, "Issue description is required"),
  remarkDetails: z.string().optional(),
  ticketStatus: z.string().min(1, "Status is required"),
  attendedBy: z.string().optional(),
  attendedDate: z.string().optional(),
  closingDate: z.string().optional(),
  paidStatus: z.string().optional(),
  amountReceived: z.string().optional(),
  feedback: z.string().optional(),
  feedbackDate: z.string().optional(),
  feedbackTakenBy: z.string().optional(),
  finalRemark: z.string().optional(),
});

type TicketForm = z.infer<typeof ticketSchema>;

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: Ticket | null;
  onSuccess: () => void;
}

export default function TicketModal({ isOpen, onClose, ticket, onSuccess }: TicketModalProps) {
  const { toast } = useToast();
  const isEditing = !!ticket;

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      date: "",
      projectType: "",
      receivedBy: "",
      siteName: "",
      contactPerson: "",
      mobile: "",
      address: "",
      issue: "",
      remarkDetails: "",
      ticketStatus: "Open",
      attendedBy: "",
      attendedDate: "",
      closingDate: "",
      paidStatus: "",
      amountReceived: "",
      feedback: "",
      feedbackDate: "",
      feedbackTakenBy: "",
      finalRemark: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (ticket) {
      form.reset({
        date: ticket.date || "",
        projectType: ticket.projectType || "",
        receivedBy: ticket.receivedBy || "",
        siteName: ticket.siteName || "",
        contactPerson: ticket.contactPerson || "",
        mobile: ticket.mobile || "",
        address: ticket.address || "",
        issue: ticket.issue || "",
        remarkDetails: ticket.remarkDetails || "",
        ticketStatus: ticket.ticketStatus || "Open",
        attendedBy: ticket.attendedBy || "",
        attendedDate: ticket.attendedDate || "",
        closingDate: ticket.closingDate || "",
        paidStatus: ticket.paidStatus || "",
        amountReceived: ticket.amountReceived?.toString() || "",
        feedback: ticket.feedback || "",
        feedbackDate: ticket.feedbackDate || "",
        feedbackTakenBy: ticket.feedbackTakenBy || "",
        finalRemark: ticket.finalRemark || "",
      });
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        projectType: "",
        receivedBy: "",
        siteName: "",
        contactPerson: "",
        mobile: "",
        address: "",
        issue: "",
        remarkDetails: "",
        ticketStatus: "Open",
        attendedBy: "",
        attendedDate: "",
        closingDate: "",
        paidStatus: "",
        amountReceived: "",
        feedback: "",
        feedbackDate: "",
        feedbackTakenBy: "",
        finalRemark: "",
      });
    }
  }, [ticket, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: TicketForm) => {
      const payload = {
        ...data,
        amountReceived: data.amountReceived ? parseFloat(data.amountReceived) : null,
      };

      if (isEditing) {
        const response = await apiRequest("PUT", `/api/tickets/${ticket.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/tickets", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Ticket Updated" : "Ticket Created",
        description: `Ticket has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} ticket.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketForm) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Complaint Ticket" : "New Complaint Ticket"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Network Infrastructure">Network Infrastructure</SelectItem>
                        <SelectItem value="Security Systems">Security Systems</SelectItem>
                        <SelectItem value="Communication Systems">Communication Systems</SelectItem>
                        <SelectItem value="IT Support">IT Support</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Installation">Installation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receivedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received By</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Staff name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Site location or name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contact person name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mobile number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ticketStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attendedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attended By</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Technician name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attendedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attended Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paidStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select paid status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Received (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Complete address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Describe the issue in detail" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remarkDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remark Details</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Additional remarks or notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Customer feedback" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="feedbackDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feedbackTakenBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback Taken By</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Staff name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="finalRemark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Remark</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Final remarks or resolution notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saveMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    {isEditing ? "Update Ticket" : "Save Ticket"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
