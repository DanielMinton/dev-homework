"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { createTickets } from "@/lib/api";
import { useToast } from "./ui/use-toast";
import { Loader2, Plus } from "lucide-react";

interface TicketFormProps {
  onTicketCreated: () => void;
}

export function TicketForm({ onTicketCreated }: TicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await createTickets([{ title, description }]);

      toast({
        title: "Request submitted",
        description: "Guest request added successfully",
      });

      setTitle("");
      setDescription("");
      onTicketCreated();
    } catch {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">New Request</CardTitle>
        <CardDescription className="text-xs">Log a guest request for analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">Summary</Label>
            <Input
              id="title"
              placeholder="Brief summary of guest request"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Details</Label>
            <Textarea
              id="description"
              placeholder="Include room number, guest details, and specific needs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button type="submit" disabled={loading} className="w-full h-9" size="sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add Request
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );
}
