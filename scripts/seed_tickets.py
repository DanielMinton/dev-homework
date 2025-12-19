#!/usr/bin/env python3
"""
seed script for populating the database with realistic hospitality tickets.
run with: python scripts/seed_tickets.py
"""

import asyncio
import os
from typing import List, Dict

import httpx
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from dotenv import load_dotenv

load_dotenv()

console = Console()

API_URL = os.getenv("API_URL", "http://localhost:3002")

# realistic hospitality tickets spanning various departments
TICKETS: List[Dict[str, str]] = [
    # room service (5)
    {
        "title": "Room 412 - Breakfast order 45 minutes late",
        "description": "Guest called twice already. Ordered continental breakfast at 7:15am, still hasn't arrived. Guest has a meeting at 8:30am and is getting upset."
    },
    {
        "title": "Room 718 - Wrong dinner order delivered",
        "description": "Ordered the grilled salmon, received chicken parmesan instead. Guest has a fish allergy concern with the replacement - wants fresh salmon, not the one that's been sitting."
    },
    {
        "title": "Room 305 - Cold room service food",
        "description": "Steak arrived cold after 30 min wait. Guest is a diamond member and this is the second issue this stay. Would like a replacement and considering asking for comp."
    },
    {
        "title": "Room 622 - Dietary restriction ignored",
        "description": "Ordered gluten-free pasta, received regular pasta. Guest has celiac disease. Very concerned about cross-contamination. Needs manager callback."
    },
    {
        "title": "Room 801 - Minibar charge dispute",
        "description": "Guest claims they didn't consume the $18 snack items showing on their bill. Says the minibar was already partially empty on check-in. Wants charges removed."
    },

    # maintenance (5)
    {
        "title": "Room 1502 - AC not working, VIP suite",
        "description": "Presidential suite AC blowing warm air only. Outside temp is 95F. Guest is CEO hosting board dinner in suite tonight at 7pm. URGENT - needs immediate attention."
    },
    {
        "title": "Room 234 - Toilet won't stop running",
        "description": "Toilet has been running constantly since last night. Guest couldn't sleep due to noise. Water bill concern as well. Please send plumber."
    },
    {
        "title": "Room 567 - Power outlet sparking",
        "description": "Guest reports the outlet near the desk sparked when they plugged in laptop. Smell of burning. Safety concern - please send electrician immediately."
    },
    {
        "title": "Room 890 - Broken desk chair",
        "description": "Office chair wheel broke off, guest almost fell. Business traveler needs to work from room. Requesting replacement chair ASAP."
    },
    {
        "title": "Room 445 - TV not working",
        "description": "Smart TV stuck on loading screen, won't connect to any apps or cable. Guest wanted to watch the game tonight. Tried unplugging already."
    },

    # housekeeping (4)
    {
        "title": "Room 333 - Room not cleaned today",
        "description": "Guest returned at 4pm, room hasn't been serviced. Dirty towels still on floor, bed unmade, trash not emptied. DND sign was NOT on door."
    },
    {
        "title": "Room 712 - Need extra towels and pillows",
        "description": "Family of 4, need 4 extra bath towels and 2 extra pillows. Also requesting hypoallergenic pillow covers if available."
    },
    {
        "title": "Room 205 - Early cleaning request",
        "description": "Guest leaving for all-day excursion at 8am, would like room cleaned by 9am so it's fresh when they return at 6pm. Willing to tip."
    },
    {
        "title": "Room 908 - Lost item inquiry",
        "description": "Guest checked out yesterday, believes they left a gold watch in the nightstand drawer. Very sentimental value. Can someone check lost and found?"
    },

    # front desk (4)
    {
        "title": "Room 401 - Late checkout request",
        "description": "Flight doesn't leave until 8pm, requesting 4pm late checkout instead of standard 11am. Platinum member, 5th stay this year."
    },
    {
        "title": "Room 156 - Room change request",
        "description": "Current room faces the parking lot and highway, too noisy to sleep. Requesting move to courtyard or pool view. Willing to pay upgrade fee if needed."
    },
    {
        "title": "Room 678 - Billing discrepancy",
        "description": "Final bill shows 4 nights but guest only stayed 3. Also seeing a $50 resort fee that wasn't mentioned at booking. Needs itemized review."
    },
    {
        "title": "Room 289 - Key card not working",
        "description": "Key card demagnetized for third time this stay. Guest is frustrated with multiple trips to front desk. Requesting room re-keyed entirely."
    },

    # concierge (3)
    {
        "title": "Room 1201 - Restaurant reservation needed",
        "description": "Anniversary dinner tonight, looking for upscale Italian within walking distance. Party of 2 at 7:30pm. Preference for quiet table, maybe window."
    },
    {
        "title": "Room 503 - Airport transportation",
        "description": "Need car service to airport tomorrow 5:30am. International terminal, flight at 8:15am. 2 passengers, 3 large bags. Prefer black car over shuttle."
    },
    {
        "title": "Room 777 - Local attractions help",
        "description": "Family with kids ages 8 and 12, here for 3 days. Looking for recommendations - museums, outdoor activities, good lunch spots. Not too touristy."
    },

    # noise complaints (2)
    {
        "title": "Room 420 - Loud neighbors",
        "description": "Room 422 has been loud since 11pm, sounds like a party. Multiple people talking loudly, music playing. Guest has early flight, can't sleep."
    },
    {
        "title": "Room 602 - Construction noise",
        "description": "Drilling and hammering started at 7am, still going. Guest works night shift, this is their sleep time. How long will construction continue?"
    },

    # amenities (3)
    {
        "title": "Room 345 - Pool access issue",
        "description": "Pool gate keypad not accepting room number. Tried multiple times with correct code. Kids are disappointed, hot day outside."
    },
    {
        "title": "Room 912 - Spa booking problem",
        "description": "Booked couples massage for 2pm online, but spa says no record of reservation. Confirmation email attached. This was an anniversary surprise."
    },
    {
        "title": "Room 234 - WiFi not working",
        "description": "Internet keeps dropping every few minutes. Guest is remote worker, has important video call in 1 hour. Tried reconnecting, restarting devices."
    },

    # additional variety
    {
        "title": "Room 1405 - VIP early arrival",
        "description": "Board chairman arriving at 10am, flight landed early. Standard check-in is 3pm. Suite needs to be ready. Champagne and fruit basket requested."
    },
    {
        "title": "Room 188 - Accessibility request",
        "description": "Guest's mobility scooter battery died. Need outlet near entrance to charge, or assistance getting to room. Currently stuck in lobby."
    },
]


async def seed_tickets() -> None:
    """posts all tickets to the api and displays results"""

    console.print("\n[bold blue]Guest Request Analyst - Database Seeder[/bold blue]\n")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # check api health first
        try:
            health = await client.get(f"{API_URL}/health")
            health.raise_for_status()
            console.print(f"[green]API connected:[/green] {API_URL}\n")
        except Exception as e:
            console.print(f"[red]Failed to connect to API:[/red] {e}")
            console.print(f"Make sure the backend is running at {API_URL}")
            return

        results = []

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("Seeding tickets...", total=len(TICKETS))

            for ticket in TICKETS:
                try:
                    response = await client.post(
                        f"{API_URL}/api/tickets",
                        json={"tickets": [ticket]},
                    )
                    response.raise_for_status()
                    data = response.json()
                    results.append({
                        "title": ticket["title"][:50] + "..." if len(ticket["title"]) > 50 else ticket["title"],
                        "status": "success",
                        "id": data.get("tickets", [{}])[0].get("id", "?"),
                    })
                except Exception as e:
                    results.append({
                        "title": ticket["title"][:50] + "..." if len(ticket["title"]) > 50 else ticket["title"],
                        "status": "failed",
                        "id": str(e)[:30],
                    })

                progress.advance(task)

        # display results table
        table = Table(title="\nSeeding Results")
        table.add_column("ID", style="cyan", width=6)
        table.add_column("Ticket", style="white")
        table.add_column("Status", style="green")

        success_count = 0
        for r in results:
            status_style = "green" if r["status"] == "success" else "red"
            table.add_row(
                str(r["id"]),
                r["title"],
                f"[{status_style}]{r['status']}[/{status_style}]"
            )
            if r["status"] == "success":
                success_count += 1

        console.print(table)
        console.print(f"\n[bold]Summary:[/bold] {success_count}/{len(TICKETS)} tickets created successfully\n")


if __name__ == "__main__":
    asyncio.run(seed_tickets())
