import os
import tempfile
import pytest

# Point to temporary test databases before any application modules are imported
TEST_DIR = tempfile.mkdtemp(prefix="sahajcredit_test_")
TEST_AUDIT_DB = os.path.join(TEST_DIR, "test_audit_service.db")
TEST_APP_DB = os.path.join(TEST_DIR, "test_application_service.db")

os.environ["AUDIT_DB_PATH"] = TEST_AUDIT_DB
os.environ["APPLICATION_DB_PATH"] = TEST_APP_DB

@pytest.fixture(autouse=True)
def isolate_test_databases(monkeypatch):
    """
    Ensures each test operates on isolated test databases and prevents polluting live databases.
    """
    monkeypatch.setenv("AUDIT_DB_PATH", TEST_AUDIT_DB)
    monkeypatch.setenv("APPLICATION_DB_PATH", TEST_APP_DB)
    yield
