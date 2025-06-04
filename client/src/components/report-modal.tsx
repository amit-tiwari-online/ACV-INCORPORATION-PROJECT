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
import type { Report } from "@shared/schema";

const reportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  kmIn: z.string().min(1, "KM In is required"),
  kmOut: z.string().min(1, "KM Out is required"),
  site1: z.string().optional(),
  serviceReport1: z.string().optional(),
  site2: z.string().optional(),
  serviceReport2: z.string().optional(),
  site3: z.string().optional(),
  site4: z.string().optional(),
  serviceReport3: z.string().optional(),
  transportMode: z.string().optional(),
  totalKm: z.string().min(1, "Total KM is required"),
  amount: z.string().min(1, "Amount is required"),
  paidOn: z.string().optional(),
});

type ReportForm = z.infer<typeof reportSchema>;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: Report | null;
  onSuccess: () => void;
}

export default function ReportModal({ isOpen, onClose, report, onSuccess }: ReportModalProps) {
  const { toast } = useToast();
  const isEditing = !!report;

  const form = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: "",
      date: "",
      kmIn: "",
      kmOut: "",
      site1: "",
      serviceReport1: "",
      site2: "",
      serviceReport2: "",
      site3: "",
      site4: "",
      serviceReport3: "",
      transportMode: "",
      totalKm: "",
      amount: "",
      paidOn: "",
    },
  });

  // Auto-calculate total KM
  const kmIn = form.watch("kmIn");
  const kmOut = form.watch("kmOut");

  useEffect(() => {
    if (kmIn && kmOut) {
      const totalKm = parseInt(kmOut) - parseInt(kmIn);
      form.setValue("totalKm", totalKm.toString());
    }
  }, [kmIn, kmOut, form]);

  // Populate form when editing
  useEffect(() => {
    if (report) {
      form.reset({
        name: report.name || "",
        date: report.date || "",
        kmIn: report.kmIn?.toString() || "",
        kmOut: report.kmOut?.toString() || "",
        site1: report.site1 || "",
        serviceReport1: report.serviceReport1 || "",
        site2: report.site2 || "",
        serviceReport2: report.serviceReport2 || "",
        site3: report.site3 || "",
        site4: report.site4 || "",
        serviceReport3: report.serviceReport3 || "",
        transportMode: report.transportMode || "",
        totalKm: report.totalKm?.toString() || "",
        amount: report.amount?.toString() || "",
        paidOn: report.paidOn || "",
      });
    } else {
      form.reset({
        name: "",
        date: new Date().toISOString().split('T')[0],
        kmIn: "",
        kmOut: "",
        site1: "",
        serviceReport1: "",
        site2: "",
        serviceReport2: "",
        site3: "",
        site4: "",
        serviceReport3: "",
        transportMode: "",
        totalKm: "",
        amount: "",
        paidOn: "",
      });
    }
  }, [report, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ReportForm) => {
      const payload = {
        ...data,
        kmIn: parseInt(data.kmIn),
        kmOut: parseInt(data.kmOut),
        totalKm: parseInt(data.totalKm),
        amount: parseFloat(data.amount),
      };

      if (isEditing) {
        const response = await apiRequest("PUT", `/api/reports/${report.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/reports", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Report Updated" : "Report Created",
        description: `Report has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} report.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportForm) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Daily Report" : "New Daily Report"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Employee name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="kmIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM In</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="Starting KM" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kmOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Out</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="Ending KM" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site 1</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="First site visited" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceReport1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Report 1</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site 2</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Second site visited" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceReport2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Report 2</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site 3</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Third site visited" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site4"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site 4</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Fourth site visited" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceReport3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Report 3</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transportMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transport Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Company Vehicle">Company Vehicle</SelectItem>
                        <SelectItem value="Personal Vehicle">Personal Vehicle</SelectItem>
                        <SelectItem value="Public Transport">Public Transport</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total KM</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="Total kilometers" readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="Reimbursement amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paidOn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid On</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    {isEditing ? "Update Report" : "Save Report"}
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
