"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Ticket, updateTicket, deleteTicket } from "@/lib/api";
import { Inbox, Pencil, Trash2, Lock, AlertTriangle } from "lucide-react";

interface TicketListProps {
  tickets: Ticket[];
  loading?: boolean;
  onTicketUpdated?: () => void;
}

type ModalMode = "none" | "auth-edit" | "auth-delete" | "edit";

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

export function TicketList({ tickets, loading, onTicketUpdated }: TicketListProps) {
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const resetModal = () => {
    setModalMode("none");
    setSelectedTicket(null);
    setUsername("");
    setPassword("");
    setEditTitle("");
    setEditDescription("");
    setError("");
    setIsSubmitting(false);
  };

  const handleEditClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    if (credentials) {
      setModalMode("edit");
    } else {
      setModalMode("auth-edit");
    }
  };

  const handleDeleteClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (credentials) {
      handleDelete();
    } else {
      setModalMode("auth-delete");
    }
  };

  const handleAuthSubmit = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    const creds = { username, password };

    if (modalMode === "auth-edit") {
      setCredentials(creds);
      setModalMode("edit");
      setError("");
    } else if (modalMode === "auth-delete") {
      setCredentials(creds);
      await handleDeleteWithCreds(creds);
    }
  };

  const handleDeleteWithCreds = async (creds: { username: string; password: string }) => {
    if (!selectedTicket) return;

    setIsSubmitting(true);
    setError("");

    try {
      await deleteTicket(selectedTicket.id, creds);
      resetModal();
      setCredentials(creds);
      onTicketUpdated?.();
    } catch (err) {
      if (err instanceof Error && err.message === "Invalid credentials") {
        setError("Invalid username or password");
        setCredentials(null);
      } else {
        setError("Failed to delete ticket");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!credentials) return;
    await handleDeleteWithCreds(credentials);
  };

  const handleEditSubmit = async () => {
    if (!selectedTicket || !credentials) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      setError("Title and description are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await updateTicket(
        selectedTicket.id,
        { title: editTitle.trim(), description: editDescription.trim() },
        credentials
      );
      resetModal();
      onTicketUpdated?.();
    } catch (err) {
      if (err instanceof Error && err.message === "Invalid credentials") {
        setError("Invalid credentials. Please re-authenticate.");
        setCredentials(null);
        setModalMode("auth-edit");
      } else {
        setError("Failed to update ticket");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Guest Requests ({tickets.length})</CardTitle>
              <CardDescription>All submitted requests pending analysis</CardDescription>
            </div>
            {credentials && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Admin mode</span>
              </div>
            )}
          </div>
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
                  className="group p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground leading-snug mb-1">
                        {ticket.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditClick(ticket)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClick(ticket)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Auth Modal */}
      <Dialog open={modalMode === "auth-edit" || modalMode === "auth-delete"} onOpenChange={() => resetModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Authentication
            </DialogTitle>
            <DialogDescription>
              Enter admin credentials to {modalMode === "auth-edit" ? "edit" : "delete"} this request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleAuthSubmit()}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetModal}>
              Cancel
            </Button>
            <Button onClick={handleAuthSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Authenticate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={modalMode === "edit"} onOpenChange={() => resetModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Request
            </DialogTitle>
            <DialogDescription>
              Update the guest request details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Request title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Request details"
                rows={4}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetModal}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
