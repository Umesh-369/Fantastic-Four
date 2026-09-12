import sqlite3
import json
import uuid
from datetime import datetime, timezone
import os

DB_PATH = os.environ.get("APPLICATION_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "application_service.db"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS applicants (
            applicant_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            date_of_birth TEXT,
            phone_number TEXT NOT NULL,
            employment_type TEXT NOT NULL,
            monthly_income REAL NOT NULL,
            requested_loan_amount REAL NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

def create_applicant(applicant_data: dict) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    applicant_id = f"APP_{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()

    full_name = applicant_data.get("full_name", "")
    date_of_birth = applicant_data.get("date_of_birth")
    phone_number = applicant_data.get("phone_number", "")
    employment_type = applicant_data.get("employment_type", "gig")
    monthly_income = float(applicant_data.get("monthly_income", 0.0))
    requested_loan_amount = float(applicant_data.get("requested_loan_amount", 0.0))

    cursor.execute("""
        INSERT INTO applicants (
            applicant_id, full_name, date_of_birth, phone_number,
            employment_type, monthly_income, requested_loan_amount,
            data_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        applicant_id, full_name, date_of_birth, phone_number,
        employment_type, monthly_income, requested_loan_amount,
        json.dumps(applicant_data), created_at
    ))
    conn.commit()
    conn.close()

    result = dict(applicant_data)
    result["applicant_id"] = applicant_id
    result["created_at"] = created_at
    return result

def get_applicant(applicant_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    data = json.loads(row["data_json"])
    data["applicant_id"] = row["applicant_id"]
    data["created_at"] = row["created_at"]
    return data

def list_applicants(limit: int = 50, offset: int = 0):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applicants ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset))
    rows = cursor.fetchall()
    cursor.execute("SELECT COUNT(*) as cnt FROM applicants")
    total = cursor.fetchone()["cnt"]
    conn.close()

    items = []
    for r in rows:
        data = json.loads(r["data_json"])
        data["applicant_id"] = r["applicant_id"]
        data["created_at"] = r["created_at"]
        items.append(data)
    return {"total": total, "items": items}
