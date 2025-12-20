const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://backend-working.up.railway.app'
    : 'http://localhost:3001');

export interface Ticket {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export interface TicketAnalysisResult {
  id: number;
  category: string | null;
  priority: string | null;
  notes: string | null;
  createdAt: string;
  ticket: Ticket;
}

export interface AnalysisRun {
  id: number;
  createdAt: string;
  summary: string | null;
  status: string;
  ticketCount: number;
}

export interface AnalysisResponse {
  success: boolean;
  run: AnalysisRun | null;
  analyses: TicketAnalysisResult[];
}

export async function createTickets(tickets: Array<{ title: string; description: string }>): Promise<{ success: boolean; tickets: Ticket[] }> {
  const response = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tickets }),
  });

  if (!response.ok) {
    throw new Error("Failed to create tickets");
  }

  return response.json();
}

export async function getTickets(): Promise<{ success: boolean; tickets: Ticket[] }> {
  const response = await fetch(`${API_URL}/api/tickets`);

  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return response.json();
}

export async function analyzeTickets(ticketIds?: number[]): Promise<{ success: boolean; runId: number; status: string }> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ticketIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to start analysis");
  }

  return response.json();
}

export async function getLatestAnalysis(): Promise<AnalysisResponse> {
  const response = await fetch(`${API_URL}/api/analysis/latest`);

  if (!response.ok) {
    throw new Error("Failed to fetch analysis");
  }

  return response.json();
}

export async function getAnalysis(runId: number): Promise<AnalysisResponse> {
  const response = await fetch(`${API_URL}/api/analysis/${runId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch analysis");
  }

  return response.json();
}

export async function updateTicket(
  id: number,
  data: { title: string; description: string },
  credentials: { username: string; password: string }
): Promise<{ success: boolean; ticket?: Ticket }> {
  const basicAuth = btoa(`${credentials.username}:${credentials.password}`);

  const response = await fetch(`${API_URL}/api/tickets/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${basicAuth}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("Invalid credentials");
  }

  if (!response.ok) {
    throw new Error("Failed to update ticket");
  }

  return response.json();
}

export async function deleteTicket(
  id: number,
  credentials: { username: string; password: string }
): Promise<{ success: boolean }> {
  const basicAuth = btoa(`${credentials.username}:${credentials.password}`);

  const response = await fetch(`${API_URL}/api/tickets/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
    },
  });

  if (response.status === 401) {
    throw new Error("Invalid credentials");
  }

  if (!response.ok) {
    throw new Error("Failed to delete ticket");
  }

  return response.json();
}
