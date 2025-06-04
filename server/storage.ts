import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq, and, like, or, desc, gte, lte } from 'drizzle-orm';
import { users, tickets, reports, type User, type InsertUser, type Ticket, type InsertTicket, type Report, type InsertReport } from '@shared/schema';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Ticket operations
  getTickets(filters?: { search?: string; status?: string; projectType?: string }): Promise<Ticket[]>;
  getTicketById(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  
  // Report operations
  getReports(filters?: { search?: string; fromDate?: string; toDate?: string }): Promise<Report[]>;
  getReportById(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, report: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: number): Promise<boolean>;
}

export class MySQLStorage implements IStorage {
  private db: any = null;
  private connection: mysql.Connection | null = null;

  private async getDb() {
    if (!this.db) {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'ACV01@',
        database: process.env.DB_NAME || 'acv_db',
        port: parseInt(process.env.DB_PORT || '3306')
      });
      
      this.db = drizzle(this.connection);
      console.log('Connected to MySQL database');
    }
    return this.db;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(users).where(eq(users.userId, userId));
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user by userId:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const db = await this.getDb();
      const result = await db.insert(users).values(user);
      const newUser = await this.getUser(result[0].insertId);
      return newUser!;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Ticket operations
  async getTickets(filters?: { search?: string; status?: string; projectType?: string }): Promise<Ticket[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(tickets);
      
      if (filters?.search || filters?.status || filters?.projectType) {
        const conditions = [];
        
        if (filters?.search) {
          const searchTerm = `%${filters.search}%`;
          conditions.push(
            or(
              like(tickets.ticketNo, searchTerm),
              like(tickets.siteName, searchTerm),
              like(tickets.contactPerson, searchTerm)
            )
          );
        }
        
        if (filters?.status) {
          conditions.push(eq(tickets.ticketStatus, filters.status));
        }
        
        if (filters?.projectType) {
          conditions.push(eq(tickets.projectType, filters.projectType));
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const result = await query.orderBy(desc(tickets.date));
      return result;
    } catch (error) {
      console.error('Error getting tickets:', error);
      throw new Error('Failed to retrieve tickets');
    }
  }

  async getTicketById(id: number): Promise<Ticket | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(tickets).where(eq(tickets.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting ticket by ID:', error);
      throw new Error('Failed to retrieve ticket');
    }
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    try {
      const db = await this.getDb();
      
      // Generate ticket number
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const [countResult] = await this.connection!.execute('SELECT COUNT(*) as count FROM tickets WHERE YEAR(date) = ?', [year]);
      const count = (countResult as any)[0].count + 1;
      const ticketNo = `TKT-${year}-${count.toString().padStart(3, '0')}`;

      const ticketData = {
        ...ticket,
        ticketNo,
        ticketStatus: ticket.ticketStatus || 'Open'
      };

      const result = await db.insert(tickets).values(ticketData);
      const newTicket = await this.getTicketById(result[0].insertId);
      return newTicket!;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw new Error('Failed to create ticket');
    }
  }

  async updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> {
    try {
      const db = await this.getDb();
      await db.update(tickets).set(ticket).where(eq(tickets.id, id));
      return await this.getTicketById(id);
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw new Error('Failed to update ticket');
    }
  }

  async deleteTicket(id: number): Promise<boolean> {
    try {
      const db = await this.getDb();
      const result = await db.delete(tickets).where(eq(tickets.id, id));
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw new Error('Failed to delete ticket');
    }
  }

  // Report operations
  async getReports(filters?: { search?: string; fromDate?: string; toDate?: string }): Promise<Report[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(reports);
      
      if (filters?.search || filters?.fromDate || filters?.toDate) {
        const conditions = [];
        
        if (filters?.search) {
          const searchTerm = `%${filters.search}%`;
          conditions.push(like(reports.name, searchTerm));
        }
        
        if (filters?.fromDate) {
          conditions.push(gte(reports.date, filters.fromDate));
        }
        
        if (filters?.toDate) {
          conditions.push(lte(reports.date, filters.toDate));
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const result = await query.orderBy(desc(reports.date));
      return result;
    } catch (error) {
      console.error('Error getting reports:', error);
      throw new Error('Failed to retrieve reports');
    }
  }

  async getReportById(id: number): Promise<Report | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(reports).where(eq(reports.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting report by ID:', error);
      throw new Error('Failed to retrieve report');
    }
  }

  async createReport(report: InsertReport): Promise<Report> {
    try {
      const db = await this.getDb();
      const result = await db.insert(reports).values(report);
      const newReport = await this.getReportById(result[0].insertId);
      return newReport!;
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error('Failed to create report');
    }
  }

  async updateReport(id: number, report: Partial<InsertReport>): Promise<Report | undefined> {
    try {
      const db = await this.getDb();
      await db.update(reports).set(report).where(eq(reports.id, id));
      return await this.getReportById(id);
    } catch (error) {
      console.error('Error updating report:', error);
      throw new Error('Failed to update report');
    }
  }

  async deleteReport(id: number): Promise<boolean> {
    try {
      const db = await this.getDb();
      const result = await db.delete(reports).where(eq(reports.id, id));
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error('Failed to delete report');
    }
  }
}

export const storage = new MySQLStorage();