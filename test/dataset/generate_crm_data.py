import pandas as pd
import numpy as np
import random
from faker import Faker
from datetime import datetime, timedelta
from pathlib import Path

fake = Faker()

STATUSES = (
    ["COMPLETED"] * 80
    + ["PENDING"] * 10
    + ["CANCELLED"] * 5
    + ["REFUNDED"] * 5
)

CURRENCIES = ["INR"]

COUNTRIES = [
    ("India", "Delhi", "New Delhi"),
    ("India", "Maharashtra", "Mumbai"),
    ("India", "Karnataka", "Bangalore"),
    ("India", "Tamil Nadu", "Chennai"),
    ("India", "West Bengal", "Kolkata"),
    ("United States", "California", "San Francisco"),
    ("United States", "New York", "New York"),
    ("Canada", "Ontario", "Toronto"),
    ("United Kingdom", "England", "London"),
    ("Australia", "NSW", "Sydney"),
]

OUTPUT_DIR = Path("crm_datasets")
OUTPUT_DIR.mkdir(exist_ok=True)


def weighted_amount(vip=False):
    if vip:
        return random.choice([
            5000, 10000, 15000, 25000, 50000
        ])

    return random.choice([
        99,
        199,
        499,
        999,
        1499,
        2499,
        4999
    ])


def random_order_date():
    bucket = random.random()

    if bucket < 0.20:
        days = random.randint(0, 1)

    elif bucket < 0.40:
        days = random.randint(2, 7)

    elif bucket < 0.70:
        days = random.randint(8, 30)

    else:
        days = random.randint(31, 365)

    return (
        datetime.now() - timedelta(days=days)
    ).strftime("%Y-%m-%d")


def generate_customers(customer_count):
    customers = []

    vip_count = int(customer_count * 0.20)

    duplicate_names = [
        "Rahul Sharma",
        "Priya Singh",
        "Amit Kumar",
        "Sneha Gupta"
    ]

    for i in range(customer_count):

        customer_id = f"CUST{i+1:06d}"

        country, state, city = random.choice(COUNTRIES)

        if i < len(duplicate_names):
            name = duplicate_names[i]
        elif i < len(duplicate_names) * 2:
            name = random.choice(duplicate_names)
        else:
            name = fake.name()

        if random.random() < 0.03:
            name += " " + fake.last_name() + " " + fake.last_name()

        phone = fake.phone_number()

        if random.random() < 0.05:
            phone = ""

        customer = {
            "external_customer_id": customer_id,
            "name": name,
            "email": f"{customer_id.lower()}@example.com",
            "phone": phone,
            "city": city,
            "state": state,
            "country": country,
            "vip": i < vip_count
        }

        customers.append(customer)

    return customers


def generate_orders(customers, order_count):

    orders = []

    vip_customers = [
        c for c in customers if c["vip"]
    ]

    normal_customers = [
        c for c in customers if not c["vip"]
    ]

    vip_order_count = int(order_count * 0.80)

    for i in range(order_count):

        if i < vip_order_count:
            customer = random.choice(vip_customers)
            vip = True
        else:
            customer = random.choice(normal_customers)
            vip = False

        order = {
            "external_order_id": f"ORD{i+1:08d}",
            "external_customer_id": customer["external_customer_id"],
            "amount": weighted_amount(vip),
            "currency": "INR",
            "order_date": random_order_date(),
            "status": random.choice(STATUSES)
        }

        orders.append(order)

    return orders


def create_dataset(customer_count, order_count):

    customers = generate_customers(customer_count)
    orders = generate_orders(customers, order_count)

    customer_df = pd.DataFrame(customers)
    customer_df = customer_df.drop(columns=["vip"])

    order_df = pd.DataFrame(orders)

    customer_df.to_csv(
        OUTPUT_DIR /
        f"customers_{customer_count}.csv",
        index=False
    )

    order_df.to_csv(
        OUTPUT_DIR /
        f"orders_{order_count}.csv",
        index=False
    )

    print(
        f"Generated {customer_count} customers "
        f"and {order_count} orders"
    )


create_dataset(100, 500)
create_dataset(1000, 10000)
create_dataset(10000, 100000)

print("Done.")