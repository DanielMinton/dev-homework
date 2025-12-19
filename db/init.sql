CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_runs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    summary TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    ticket_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ticket_analysis (
    id SERIAL PRIMARY KEY,
    analysis_run_id INTEGER REFERENCES analysis_runs(id) ON DELETE CASCADE,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    category VARCHAR(100),
    priority VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_analysis_run ON ticket_analysis(analysis_run_id);
CREATE INDEX idx_ticket_analysis_ticket ON ticket_analysis(ticket_id);
