"""
Seed Orders Data

Generates and inserts at least 200 orders into the SQLite database,
aligned with the sample data in backend/README.md.
"""

import os
import sqlite3
import uuid
import random
from datetime import datetime, timedelta

from app.database import DATABASE_PATH


def ensure_orders_table_exists():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT name FROM sqlite_master WHERE type='table' AND name='orders'
        """
    )
    exists = cursor.fetchone() is not None
    conn.close()
    return exists


def base_sample_orders():
    """Returns the base sample orders matching README entries."""
    # Dates anchored to December 2024 sample
    def iso_date(d):
        return d.strftime("%Y-%m-%d")

    d14 = datetime(2024, 12, 14)
    d15 = datetime(2024, 12, 15)
    d16 = datetime(2024, 12, 16)
    d17 = datetime(2024, 12, 17)

    samples = [
        {
            "order_number": "#ORD1008",
            "customer_name": "Esther Kiehn",
            "customer_email": "esther@example.com",
            "customer_avatar": "/avatars/esther.jpg",
            "order_date": iso_date(d17),
            "status": "pending",
            "total_amount": 10.50,
            "payment_status": "unpaid",
        },
        {
            "order_number": "#ORD1007",
            "customer_name": "Denise Kuhn",
            "customer_email": "denise@example.com",
            "customer_avatar": "/avatars/denise.jpg",
            "order_date": iso_date(d16),
            "status": "pending",
            "total_amount": 100.50,
            "payment_status": "unpaid",
        },
        {
            "order_number": "#ORD1006",
            "customer_name": "Clint Hoppe",
            "customer_email": "clint@example.com",
            "customer_avatar": "/avatars/clint.jpg",
            "order_date": iso_date(d16),
            "status": "completed",
            "total_amount": 60.56,
            "payment_status": "paid",
        },
        {
            "order_number": "#ORD1005",
            "customer_name": "Darin Deckow",
            "customer_email": "darin@example.com",
            "customer_avatar": "/avatars/darin.jpg",
            "order_date": iso_date(d16),
            "status": "refunded",
            "total_amount": 640.50,
            "payment_status": "paid",
        },
        {
            "order_number": "#ORD1004",
            "customer_name": "Jacquelyn Robel",
            "customer_email": "jacquelyn@example.com",
            "customer_avatar": "/avatars/jacquelyn.jpg",
            "order_date": iso_date(d15),
            "status": "completed",
            "total_amount": 39.50,
            "payment_status": "paid",
        },
        {
            "order_number": "#ORD1003",
            "customer_name": "Clint Hoppe",
            "customer_email": "clint@example.com",
            "customer_avatar": "/avatars/clint.jpg",
            "order_date": iso_date(d16),
            "status": "completed",
            "total_amount": 29.50,
            "payment_status": "paid",
        },
        {
            "order_number": "#ORD1002",
            "customer_name": "Erin Bins",
            "customer_email": "erin@example.com",
            "customer_avatar": "/avatars/erin.jpg",
            "order_date": iso_date(d16),
            "status": "completed",
            "total_amount": 120.35,
            "payment_status": "paid",
        },
        {
            "order_number": "#ORD1001",
            "customer_name": "Gretchen Quitz",
            "customer_email": "gretchen@example.com",
            "customer_avatar": "/avatars/gretchen.jpg",
            "order_date": iso_date(d14),
            "status": "refunded",
            "total_amount": 123.50,
            "payment_status": "paid",
        },
        {
            "order_number": "#ORD1000",
            "customer_name": "Stewart Kulas",
            "customer_email": "stewart@example.com",
            "customer_avatar": "/avatars/stewart.jpg",
            "order_date": None,
            "status": "pending",
            "total_amount": 0.0,
            "payment_status": "paid",
        },
    ]
    return samples


NAMES = [
    ("John Doe", "john@example.com", "/avatars/john.jpg"),
    ("Jane Smith", "jane@example.com", "/avatars/jane.jpg"),
    ("Alex Johnson", "alex@example.com", "/avatars/alex.jpg"),
    ("Maria Garcia", "maria@example.com", "/avatars/maria.jpg"),
    ("Michael Brown", "michael@example.com", "/avatars/michael.jpg"),
    ("Emily Davis", "emily@example.com", "/avatars/emily.jpg"),
    ("Chris Wilson", "chris@example.com", "/avatars/chris.jpg"),
    ("Sarah Miller", "sarah@example.com", "/avatars/sarah.jpg"),
    ("David Moore", "david@example.com", "/avatars/david.jpg"),
    ("Laura Taylor", "laura@example.com", "/avatars/laura.jpg"),
]

STATUSES = ["pending", "completed", "refunded"]
PAYMENT_BY_STATUS = {
    "pending": ["unpaid", "paid"],  # mostly unpaid
    "completed": ["paid"],
    "refunded": ["paid"],
}


def generate_additional_orders(start_ord_num: int, count: int):
    orders = []
    base_date = datetime(2024, 12, 1)
    for i in range(count):
        order_number = f"#ORD{start_ord_num + i}"
        name, email, avatar = random.choice(NAMES)
        status = random.choices(STATUSES, weights=[5, 10, 2], k=1)[0]
        payment_status = random.choice(PAYMENT_BY_STATUS[status])
        # amounts: 5.00 - 999.99
        total_amount = round(random.uniform(5, 999.99), 2)
        # spread dates across the month; some None
        date_val = base_date + timedelta(days=random.randint(0, 30))
        order_date = date_val.strftime("%Y-%m-%d") if random.random() > 0.05 else None

        orders.append(
            {
                "order_number": order_number,
                "customer_name": name,
                "customer_email": email,
                "customer_avatar": avatar,
                "order_date": order_date,
                "status": status,
                "total_amount": total_amount,
                "payment_status": payment_status,
            }
        )
    return orders


def seed_orders(target_count: int = 220):
    if not ensure_orders_table_exists():
        raise RuntimeError(
            "Orders table does not exist. Run migrations first: python migrate.py upgrade"
        )

    samples = base_sample_orders()
    # Start numbering after the highest in samples (1008)
    additional_needed = max(0, target_count - len(samples))
    additional = generate_additional_orders(start_ord_num=1009, count=additional_needed)
    all_orders = samples + additional

    now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Ensure uniqueness on order_number; skip duplicates if already present
    inserted = 0
    for o in all_orders:
        try:
            cursor.execute(
                """
                INSERT INTO orders (
                    id, order_number, customer_name, customer_email, customer_avatar,
                    order_date, status, total_amount, payment_status,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    o["order_number"],
                    o["customer_name"],
                    o["customer_email"],
                    o["customer_avatar"],
                    o["order_date"],
                    o["status"],
                    o["total_amount"],
                    o["payment_status"],
                    now_iso,
                    now_iso,
                ),
            )
            inserted += 1
        except sqlite3.IntegrityError:
            # order_number duplicate (unique) — skip
            continue

    conn.commit()
    conn.close()
    print(f"Seeded {inserted} orders.")


if __name__ == "__main__":
    seed_orders()
