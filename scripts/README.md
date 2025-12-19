# Python Utilities

Helper scripts for data seeding and analysis export.

## Setup

```bash
cd scripts
pip install -r requirements.txt
```

## Seed Database

Populates the database with 27 realistic hospitality tickets spanning room service, maintenance, housekeeping, front desk, concierge, noise complaints, and amenities.

```bash
python seed_tickets.py
```

Set `API_URL` environment variable if backend is not running on default port:

```bash
API_URL=http://localhost:3002 python seed_tickets.py
```

## Export Analysis

Exports the latest analysis run to JSON or CSV format.

```bash
# json (default)
python export_analysis.py

# csv format
python export_analysis.py --format csv

# quiet mode (no terminal output)
python export_analysis.py -f json -q
```

Exports are saved to the `exports/` directory with timestamped filenames.
