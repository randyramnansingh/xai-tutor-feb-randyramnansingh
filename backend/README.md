# Orders API

FastAPI backend for the orders management application.

## Setup
### 1. Setup Virtual Environment

```bash
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the Application

```bash
uvicorn app.main:app --reload
```

Server runs at `http://localhost:8000`

---

## Migrations & Seeding

Run SQLite migrations, then seed 200+ mock orders:

```bash
cd backend
python migrate.py upgrade
python seed_orders.py
```

By default, the database file is created at `app.db`. Override with `DATABASE_PATH=/custom/path.db`.

---

## Mock Data

**Important:** Candidates must seed their own mock data. Create orders matching the design with various statuses and payment states.

---

## API Contracts

### Order Model

```json
{
  "id": "string",
  "order_number": "string (e.g., #ORD1008)",
  "customer": {
    "name": "string",
    "email": "string",
    "avatar": "string (URL)"
  },
  "order_date": "string (ISO 8601)",
  "status": "string (pending | completed | refunded)",
  "total_amount": "number",
  "payment_status": "string (paid | unpaid)",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

### Order Statistics Model

```json
{
  "total_orders_this_month": "number",
  "pending_orders": "number",
  "shipped_orders": "number",
  "refunded_orders": "number"
}
```

---

## Endpoints

### GET /orders

Fetch all orders with optional filtering.

**Query Parameters:**
- `status`: `all` | `incomplete` | `overdue` | `ongoing` | `finished` (default: `all`)
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `10`)

**Response:** `200 OK`
```json
{
  "orders": [
    {
      "id": "1",
      "order_number": "#ORD1008",
      "customer": {
        "name": "Esther Kiehn",
        "email": "esther@example.com",
        "avatar": "/avatars/esther.jpg"
      },
      "order_date": "2024-12-17",
      "status": "pending",
      "total_amount": 10.50,
      "payment_status": "unpaid",
      "created_at": "2024-12-17T09:00:00",
      "updated_at": "2024-12-17T09:00:00"
    }
  ],
  "total": 240,
  "page": 1,
  "limit": 10,
  "total_pages": 24
}
```

---

### GET /orders/stats

Fetch order statistics for dashboard cards.

**Response:** `200 OK`
```json
{
  "total_orders_this_month": 200,
  "pending_orders": 20,
  "shipped_orders": 180,
  "refunded_orders": 10
}
```

---

### GET /orders/{id}

Fetch a single order by ID.

**Response:** `200 OK`
```json
{
  "id": "1",
  "order_number": "#ORD1008",
  "customer": {
    "name": "Esther Kiehn",
    "email": "esther@example.com",
    "avatar": "/avatars/esther.jpg"
  },
  "order_date": "2024-12-17",
  "status": "pending",
  "total_amount": 10.50,
  "payment_status": "unpaid",
  "created_at": "2024-12-17T09:00:00",
  "updated_at": "2024-12-17T09:00:00"
}
```

**Error:** `404 Not Found` if order doesn't exist

---

### POST /orders

Create a new order.

**Request Body:**
```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "total_amount": 150.00,
  "status": "pending",
  "payment_status": "unpaid"
}
```

**Response:** `201 Created`
```json
{
  "id": "generated-id",
  "order_number": "#ORD1009",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  },
  "order_date": "2024-12-17",
  "status": "pending",
  "total_amount": 150.00,
  "payment_status": "unpaid",
  "created_at": "2024-12-17T10:30:00",
  "updated_at": "2024-12-17T10:30:00"
}
```

---

### PUT /orders/{id}

Update an existing order.

**Request Body:** (partial update allowed)
```json
{
  "status": "completed",
  "payment_status": "paid"
}
```

**Response:** `200 OK`
```json
{
  "id": "1",
  "order_number": "#ORD1008",
  "customer": {
    "name": "Esther Kiehn",
    "email": "esther@example.com",
    "avatar": "/avatars/esther.jpg"
  },
  "order_date": "2024-12-17",
  "status": "completed",
  "total_amount": 10.50,
  "payment_status": "paid",
  "created_at": "2024-12-17T09:00:00",
  "updated_at": "2024-12-17T11:00:00"
}
```

**Error:** `404 Not Found` if order doesn't exist

---

### DELETE /orders/{id}

Delete an order.

**Response:** `204 No Content`

**Error:** `404 Not Found` if order doesn't exist

---

## Bulk Operations Endpoints

### PUT /orders/bulk/status

Bulk update status for multiple orders.

**Request Body:**
```json
{
  "order_ids": ["1", "2", "3"],
  "status": "completed"
}
```

**Response:** `200 OK`
```json
{
  "updated_count": 3,
  "orders": [
    { "id": "1", "status": "completed" },
    { "id": "2", "status": "completed" },
    { "id": "3", "status": "completed" }
  ]
}
```

---

### POST /orders/bulk/duplicate

Duplicate multiple orders.

**Request Body:**
```json
{
  "order_ids": ["1", "2"]
}
```

**Response:** `201 Created`
```json
{
  "duplicated_count": 2,
  "new_orders": [
    {
      "id": "new-id-1",
      "order_number": "#ORD1009",
      "original_order_id": "1"
    },
    {
      "id": "new-id-2",
      "order_number": "#ORD1010",
      "original_order_id": "2"
    }
  ]
}
```

---

### DELETE /orders/bulk

Bulk delete multiple orders.

**Request Body:**
```json
{
  "order_ids": ["1", "2", "3"]
}
```

**Response:** `200 OK`
```json
{
  "deleted_count": 3,
  "deleted_ids": ["1", "2", "3"]
}
```

---

## Sample Data

Seed your storage with orders matching the design:

| Order Number | Customer | Order Date | Status | Amount | Payment |
|--------------|----------|------------|--------|--------|---------|
| #ORD1008 | Esther Kiehn | 17 Dec 2024 | Pending | $10.50 | Unpaid |
| #ORD1007 | Denise Kuhn | 16 Dec 2024 | Pending | $100.50 | Unpaid |
| #ORD1006 | Clint Hoppe | 16 Dec 2024 | Completed | $60.56 | Paid |
| #ORD1005 | Darin Deckow | 16 Dec 2024 | Refunded | $640.50 | Paid |
| #ORD1004 | Jacquelyn Robel | 15 Dec 2024 | Completed | $39.50 | Paid |
| #ORD1003 | Clint Hoppe | 16 Dec 2024 | Completed | $29.50 | Paid |
| #ORD1002 | Erin Bins | 16 Dec 2024 | Completed | $120.35 | Paid |
| #ORD1001 | Gretchen Quitz... | 14 Dec 2024 | Refunded | $123.50 | Paid |
| #ORD1000 | Stewart Kulas | - | - | - | Paid |
