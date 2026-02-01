from typing import Optional, List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.database import get_db


router = APIRouter(prefix="/orders", tags=["orders"])


ALLOWED_STATUSES = {"pending", "completed", "refunded"}
ALLOWED_PAYMENT = {"paid", "unpaid"}


class CustomerModel(BaseModel):
    name: str
    email: str
    avatar: Optional[str] = None


class OrderCreate(BaseModel):
    customer: CustomerModel
    total_amount: float = Field(..., gt=0)
    status: str
    payment_status: str
    order_date: Optional[str] = None


class OrderUpdate(BaseModel):
    customer: Optional[CustomerModel] = None
    total_amount: Optional[float] = Field(None, gt=0)
    status: Optional[str] = None
    payment_status: Optional[str] = None
    order_date: Optional[str] = None


class BulkStatusUpdate(BaseModel):
    order_ids: List[str]
    status: str


class BulkDuplicate(BaseModel):
    order_ids: List[str]


class BulkDelete(BaseModel):
    order_ids: List[str]


def row_to_order(row) -> dict:
    return {
        "id": row["id"],
        "order_number": row["order_number"],
        "customer": {
            "name": row["customer_name"],
            "email": row["customer_email"],
            "avatar": row["customer_avatar"],
        },
        "order_date": row["order_date"],
        "status": row["status"],
        "total_amount": row["total_amount"],
        "payment_status": row["payment_status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def next_order_number(conn) -> str:
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(CAST(SUBSTR(order_number, 5) AS INTEGER)) FROM orders")
    result = cursor.fetchone()[0]
    next_num = (result or 1000) + 1
    return f"#ORD{next_num}"


@router.get("")
def list_orders(
    status: str = Query("all"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            params: List = []
            where = ""
            if status != "all":
                if status not in ALLOWED_STATUSES:
                    raise HTTPException(status_code=400, detail="Invalid status filter")
                where = "WHERE status = ?"
                params.append(status)

            cursor.execute(f"SELECT COUNT(1) FROM orders {where}", params)
            total = cursor.fetchone()[0]

            offset = (page - 1) * limit
            cursor.execute(
                f"""
                SELECT id, order_number, customer_name, customer_email, customer_avatar,
                       order_date, status, total_amount, payment_status, created_at, updated_at
                FROM orders
                {where}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
                params + [limit, offset],
            )
            rows = cursor.fetchall()
            orders = [row_to_order(row) for row in rows]

            total_pages = (total + limit - 1) // limit if limit else 1
            return {
                "orders": orders,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/bulk/status")
def bulk_update_status(payload: BulkStatusUpdate):
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    if not payload.order_ids:
        raise HTTPException(status_code=400, detail="order_ids required")

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            placeholders = ",".join(["?"] * len(payload.order_ids))

            # Only update those that exist
            cursor.execute(
                f"SELECT id FROM orders WHERE id IN ({placeholders})",
                payload.order_ids,
            )
            existing_ids = [row[0] for row in cursor.fetchall()]
            if not existing_ids:
                return {"updated_count": 0, "orders": []}

            placeholders = ",".join(["?"] * len(existing_ids))
            cursor.execute(
                f"UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN ({placeholders})",
                [payload.status] + existing_ids,
            )

            updated_count = cursor.rowcount if cursor.rowcount is not None else len(existing_ids)
            orders = [{"id": oid, "status": payload.status} for oid in existing_ids]
            return {"updated_count": updated_count, "orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/bulk/duplicate", status_code=201)
def bulk_duplicate(payload: BulkDuplicate):
    if not payload.order_ids:
        raise HTTPException(status_code=400, detail="order_ids required")

    try:
        import uuid
        from datetime import datetime

        with get_db() as conn:
            cursor = conn.cursor()

            placeholders = ",".join(["?"] * len(payload.order_ids))
            cursor.execute(
                f"""
                SELECT id, order_number, customer_name, customer_email, customer_avatar,
                       order_date, status, total_amount, payment_status
                FROM orders WHERE id IN ({placeholders})
                """,
                payload.order_ids,
            )
            originals = cursor.fetchall()

            new_orders = []
            for row in originals:
                new_id = str(uuid.uuid4())
                new_order_number = next_order_number(conn)
                now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

                cursor.execute(
                    """
                    INSERT INTO orders (
                        id, order_number, customer_name, customer_email, customer_avatar,
                        order_date, status, total_amount, payment_status,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        new_id,
                        new_order_number,
                        row["customer_name"],
                        row["customer_email"],
                        row["customer_avatar"],
                        row["order_date"],
                        row["status"],
                        row["total_amount"],
                        row["payment_status"],
                        now_iso,
                        now_iso,
                    ),
                )

                new_orders.append(
                    {
                        "id": new_id,
                        "order_number": new_order_number,
                        "original_order_id": row["id"],
                    }
                )

            return {"duplicated_count": len(new_orders), "new_orders": new_orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/bulk")
def bulk_delete(payload: BulkDelete):
    if not payload.order_ids:
        raise HTTPException(status_code=400, detail="order_ids required")

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            placeholders = ",".join(["?"] * len(payload.order_ids))

            # Count existing
            cursor.execute(
                f"SELECT COUNT(1) FROM orders WHERE id IN ({placeholders})",
                payload.order_ids,
            )
            existing_count = cursor.fetchone()[0]

            cursor.execute(
                f"DELETE FROM orders WHERE id IN ({placeholders})",
                payload.order_ids,
            )

            deleted_count = cursor.rowcount if cursor.rowcount is not None else existing_count
            return {"deleted_count": deleted_count, "deleted_ids": payload.order_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{order_id}")
def get_order(order_id: str):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, order_number, customer_name, customer_email, customer_avatar,
                       order_date, status, total_amount, payment_status, created_at, updated_at
                FROM orders WHERE id = ?
                """,
                (order_id,),
            )
            row = cursor.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Order not found")
            return row_to_order(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("", status_code=201)
def create_order(order: OrderCreate):
    if order.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    if order.payment_status not in ALLOWED_PAYMENT:
        raise HTTPException(status_code=400, detail="Invalid payment_status")

    try:
        import uuid
        from datetime import datetime

        with get_db() as conn:
            cursor = conn.cursor()
            order_id = str(uuid.uuid4())
            order_number = next_order_number(conn)
            now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

            cursor.execute(
                """
                INSERT INTO orders (
                    id, order_number, customer_name, customer_email, customer_avatar,
                    order_date, status, total_amount, payment_status,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    order_id,
                    order_number,
                    order.customer.name,
                    order.customer.email,
                    order.customer.avatar,
                    order.order_date,
                    order.status,
                    order.total_amount,
                    order.payment_status,
                    now_iso,
                    now_iso,
                ),
            )

            cursor.execute(
                "SELECT * FROM orders WHERE id = ?",
                (order_id,),
            )
            row = cursor.fetchone()
            return row_to_order(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{order_id}")
def update_order(order_id: str, order: OrderUpdate):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM orders WHERE id = ?", (order_id,))
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Order not found")

            fields = []
            values = []

            if order.customer is not None:
                fields.extend(["customer_name = ?", "customer_email = ?", "customer_avatar = ?"])
                values.extend([order.customer.name, order.customer.email, order.customer.avatar])
            if order.total_amount is not None:
                fields.append("total_amount = ?")
                values.append(order.total_amount)
            if order.status is not None:
                if order.status not in ALLOWED_STATUSES:
                    raise HTTPException(status_code=400, detail="Invalid status")
                fields.append("status = ?")
                values.append(order.status)
            if order.payment_status is not None:
                if order.payment_status not in ALLOWED_PAYMENT:
                    raise HTTPException(status_code=400, detail="Invalid payment_status")
                fields.append("payment_status = ?")
                values.append(order.payment_status)
            if order.order_date is not None:
                fields.append("order_date = ?")
                values.append(order.order_date)

            if not fields:
                raise HTTPException(status_code=400, detail="No fields to update")

            fields.append("updated_at = CURRENT_TIMESTAMP")
            set_clause = ", ".join(fields)
            values.append(order_id)

            cursor.execute(f"UPDATE orders SET {set_clause} WHERE id = ?", values)

            cursor.execute(
                """
                SELECT id, order_number, customer_name, customer_email, customer_avatar,
                       order_date, status, total_amount, payment_status, created_at, updated_at
                FROM orders WHERE id = ?
                """,
                (order_id,),
            )
            row = cursor.fetchone()
            return row_to_order(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: str):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM orders WHERE id = ?", (order_id,))
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Order not found")
            cursor.execute("DELETE FROM orders WHERE id = ?", (order_id,))
            return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
