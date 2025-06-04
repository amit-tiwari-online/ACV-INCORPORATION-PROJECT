import { pgTable, text, serial, integer, decimal, date, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  password: varchar("password", { length: 100 }).notNull(),
});

// Tickets table (Complaint Register)
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNo: varchar("ticket_no", { length: 20 }),
  date: date("date"),
  projectType: varchar("project_type", { length: 100 }),
  receivedBy: varchar("received_by", { length: 100 }),
  siteName: varchar("site_name", { length: 150 }),
  contactPerson: varchar("contact_person", { length: 100 }),
  mobile: varchar("mobile", { length: 20 }),
  address: text("address"),
  issue: text("issue"),
  remarkDetails: text("remark_details"),
  attendedBy: varchar("attended_by", { length: 100 }),
  attendedDate: date("attended_date"),
  ticketStatus: varchar("ticket_status", { length: 50 }),
  closingDate: date("closing_date"),
  paidStatus: varchar("paid_status", { length: 50 }),
  amountReceived: decimal("amount_received", { precision: 10, scale: 2 }),
  feedback: text("feedback"),
  feedbackDate: date("feedback_date"),
  feedbackTakenBy: varchar("feedback_taken_by", { length: 100 }),
  finalRemark: text("final_remark"),
});

// Daily Reports table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }),
  date: date("date"),
  kmIn: integer("km_in"),
  kmOut: integer("km_out"),
  site1: varchar("site1", { length: 100 }),
  serviceReport1: varchar("service_report1", { length: 10 }),
  site2: varchar("site2", { length: 100 }),
  serviceReport2: varchar("service_report2", { length: 10 }),
  site3: varchar("site3", { length: 100 }),
  site4: varchar("site4", { length: 100 }),
  serviceReport3: varchar("service_report3", { length: 10 }),
  transportMode: varchar("transport_mode", { length: 100 }),
  totalKm: integer("total_km"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  paidOn: date("paid_on"),
});

// Login logs table
export const loginLogs = pgTable("login_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }),
  loginTime: text("login_time"),
  status: varchar("status", { length: 50 }),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
