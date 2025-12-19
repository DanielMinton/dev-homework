"use client";

import { useState, useEffect } from "react";
import { TicketForm } from "@/components/ticket-form";
import { TicketList } from "@/components/ticket-list";
import { AnalysisPanel } from "@/components/analysis-panel";
import { getTickets, Ticket } from "@/lib/api";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Support Ticket Analyst
            </h1>
          </div>
          <p className="text-gray-600">
            AI-powered ticket categorization and priority analysis
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TicketForm onTicketCreated={handleTicketCreated} />
            <TicketList tickets={tickets} />
          </div>

          <div>
            <AnalysisPanel
              ticketCount={tickets.length}
              onAnalysisStart={handleAnalysisStart}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
