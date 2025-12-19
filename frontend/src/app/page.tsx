"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TicketForm } from "@/components/ticket-form";
import { TicketList } from "@/components/ticket-list";
import { AnalysisPanel } from "@/components/analysis-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { getTickets, Ticket } from "@/lib/api";
import { Bell } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data.tickets);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = () => {
    loadTickets();
  };

  const handleAnalysisStart = () => {
    loadTickets();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <motion.div
        className="container mx-auto px-4 py-6 sm:py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.header
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={itemVariants}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Guest Request Analyst
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              AI-powered request routing for hospitality operations
            </p>
          </div>
          <ThemeToggle />
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <motion.div className="space-y-4 sm:space-y-6" variants={itemVariants}>
            <TicketForm onTicketCreated={handleTicketCreated} />
            <TicketList tickets={tickets} loading={loading} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <AnalysisPanel
              ticketCount={tickets.length}
              onAnalysisStart={handleAnalysisStart}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
