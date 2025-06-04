import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertTicketSchema, insertReportSchema, type Ticket, type Report } from "@shared/schema";
import { z } from "zod";

// Extend session interface
declare module 'express-session' {
  interface Session {
    user?: { id: number; userId: string };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'acv-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { userId, password } = req.body;
      
      if (!userId || !password) {
        return res.status(400).json({ error: 'User ID and password are required' });
      }

      const user = await storage.getUserByUserId(userId);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.user = { id: user.id, userId: user.userId };
      res.json({ success: true, user: { id: user.id, userId: user.userId } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Check authentication status
  app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
      res.json({ authenticated: true, user: req.session.user });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Ticket endpoints
  app.get('/api/tickets', requireAuth, async (req, res) => {
    try {
      const { search, status, projectType } = req.query;
      const filters = {
        search: search as string,
        status: status as string,
        projectType: projectType as string
      };
      
      const tickets = await storage.getTickets(filters);
      res.json(tickets);
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  });

  app.get('/api/tickets/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicketById(id);
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  });

  app.post('/api/tickets', requireAuth, async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid ticket data', details: error.errors });
      }
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  });

  app.put('/api/tickets/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const ticket = await storage.updateTicket(id, updateData);
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  });

  app.delete('/api/tickets/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTicket(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ error: 'Failed to delete ticket' });
    }
  });

  // Report endpoints
  app.get('/api/reports', requireAuth, async (req, res) => {
    try {
      const { search, fromDate, toDate } = req.query;
      const filters = {
        search: search as string,
        fromDate: fromDate as string,
        toDate: toDate as string
      };
      
      const reports = await storage.getReports(filters);
      res.json(reports);
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  app.get('/api/reports/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReportById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('Get report error:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  });

  app.post('/api/reports', requireAuth, async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid report data', details: error.errors });
      }
      console.error('Create report error:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  });

  app.put('/api/reports/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const report = await storage.updateReport(id, updateData);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('Update report error:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  });

  app.delete('/api/reports/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteReport(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete report error:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  });

  // Excel export endpoints
  app.get('/api/tickets/export/excel', requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getTickets();
      
      // Set headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=tickets.xlsx');
      
      // For now, return JSON (client will handle Excel generation)
      res.json(tickets);
    } catch (error) {
      console.error('Export tickets error:', error);
      res.status(500).json({ error: 'Failed to export tickets' });
    }
  });

  app.get('/api/reports/export/excel', requireAuth, async (req, res) => {
    try {
      const reports = await storage.getReports();
      
      // Set headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reports.xlsx');
      
      // For now, return JSON (client will handle Excel generation)
      res.json(reports);
    } catch (error) {
      console.error('Export reports error:', error);
      res.status(500).json({ error: 'Failed to export reports' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
