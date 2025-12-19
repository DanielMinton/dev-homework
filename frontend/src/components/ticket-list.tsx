"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Ticket } from "@/lib/api";
import { Inbox } from "lucide-react";

interface TicketListProps {
  tickets: Ticket[];
  loading?: boolean;
}

function TicketSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-lg bg-secondary/50 animate-pulse">
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      ))}
    </div>
  );
}

export function TicketList({ tickets, loading }: TicketListProps) {
  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Guest Requests</CardTitle>
          <CardDescription>Loading requests...</CardDescription>
        </CardHeader>
        <CardContent>
          <TicketSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Guest Requests</CardTitle>
          <CardDescription>Submitted requests appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              No requests yet. Add your first guest request above.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Guest Requests ({tickets.length})</CardTitle>
        <CardDescription>All submitted requests pending analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                whileHover={{ scale: 1.01 }}
                className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
              >
                <h4 className="font-medium text-foreground leading-snug mb-1">
                  {ticket.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {ticket.description}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
