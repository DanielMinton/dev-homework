#!/usr/bin/env python3
"""
export tool for analysis results.
run with: python scripts/export_analysis.py --format json
"""

import argparse
import csv
import json
import os
from datetime import datetime
from pathlib import Path

import httpx
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from dotenv import load_dotenv

load_dotenv()

console = Console()

API_URL = os.getenv("API_URL", "http://localhost:3002")
EXPORTS_DIR = Path(__file__).parent.parent / "exports"


def fetch_latest_analysis() -> dict | None:
    """grabs the most recent analysis from the api"""
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(f"{API_URL}/api/analysis/latest")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            console.print("[yellow]No analysis found. Run an analysis first.[/yellow]")
        else:
            console.print(f"[red]API error:[/red] {e}")
        return None
    except Exception as e:
        console.print(f"[red]Failed to fetch analysis:[/red] {e}")
        return None


def export_json(data: dict, filepath: Path) -> None:
    """writes analysis to json file"""
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, default=str)


def export_csv(data: dict, filepath: Path) -> None:
    """flattens analysis data to csv format"""
    run = data.get("run", {})
    analyses = data.get("analyses", [])

    rows = []
    for analysis in analyses:
        ticket = analysis.get("ticket", {})
        rows.append({
            "run_id": run.get("id"),
            "run_date": run.get("createdAt"),
            "run_status": run.get("status"),
            "ticket_id": ticket.get("id"),
            "ticket_title": ticket.get("title"),
            "ticket_description": ticket.get("description"),
            "category": analysis.get("category"),
            "priority": analysis.get("priority"),
            "notes": analysis.get("notes"),
        })

    if rows:
        with open(filepath, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)


def display_summary(data: dict) -> None:
    """shows a quick summary of the analysis in terminal"""
    run = data.get("run", {})
    analyses = data.get("analyses", [])

    # run info panel
    console.print(Panel(
        f"[bold]Run ID:[/bold] {run.get('id')}\n"
        f"[bold]Status:[/bold] {run.get('status')}\n"
        f"[bold]Tickets Analyzed:[/bold] {run.get('ticketCount')}\n"
        f"[bold]Created:[/bold] {run.get('createdAt')}",
        title="Analysis Run",
        border_style="blue"
    ))

    # summary if exists
    if run.get("summary"):
        console.print(Panel(
            run.get("summary"),
            title="Executive Summary",
            border_style="green"
        ))

    # analysis breakdown
    if analyses:
        table = Table(title="Ticket Analysis Breakdown")
        table.add_column("ID", style="cyan", width=4)
        table.add_column("Title", style="white", max_width=35)
        table.add_column("Category", style="magenta")
        table.add_column("Priority", style="yellow")

        for a in analyses:
            ticket = a.get("ticket", {})
            priority = a.get("priority", "")
            priority_style = {
                "high": "red bold",
                "medium": "yellow",
                "low": "green"
            }.get(priority, "white")

            table.add_row(
                str(ticket.get("id", "")),
                ticket.get("title", "")[:35],
                a.get("category", ""),
                f"[{priority_style}]{priority}[/{priority_style}]"
            )

        console.print(table)


def main():
    parser = argparse.ArgumentParser(description="Export analysis results")
    parser.add_argument(
        "--format", "-f",
        choices=["json", "csv"],
        default="json",
        help="Output format (default: json)"
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Skip terminal summary display"
    )
    args = parser.parse_args()

    console.print("\n[bold blue]Guest Request Analyst - Export Tool[/bold blue]\n")

    # fetch data
    data = fetch_latest_analysis()
    if not data or not data.get("success"):
        return

    # ensure exports directory exists
    EXPORTS_DIR.mkdir(exist_ok=True)

    # generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"analysis_{timestamp}.{args.format}"
    filepath = EXPORTS_DIR / filename

    # export based on format
    if args.format == "json":
        export_json(data, filepath)
    else:
        export_csv(data, filepath)

    console.print(f"[green]Exported to:[/green] {filepath}\n")

    # show summary unless quiet mode
    if not args.quiet:
        display_summary(data)


if __name__ == "__main__":
    main()
