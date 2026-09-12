"""
SahajCredit — Concurrent Backend Microservices Launcher
Launches all 7 backend microservices in separate subprocesses with graceful shutdown.
"""

import sys
import os
import subprocess
import time
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_EXEC = os.path.join(ROOT_DIR, ".venv", "Scripts", "python.exe")
if not os.path.exists(PYTHON_EXEC):
    PYTHON_EXEC = sys.executable

# Allow Render or cloud environments to specify the public Gateway port via $PORT
GATEWAY_PORT = int(os.environ.get("PORT", 8000))

# Ensure data directories exist for SQLite persistence
os.makedirs(os.path.join(ROOT_DIR, "data", "app_data"), exist_ok=True)
os.makedirs(os.path.join(ROOT_DIR, "data", "audit_data"), exist_ok=True)

SERVICES = [
    {
        "name": "Application Service",
        "dir": os.path.join(ROOT_DIR, "services", "application-service"),
        "port": 8001,
        "app": "main:app"
    },
    {
        "name": "Credit Engine (ML)",
        "dir": os.path.join(ROOT_DIR, "services", "credit-engine"),
        "port": 8002,
        "app": "main:app"
    },
    {
        "name": "Rule Service (H+8)",
        "dir": os.path.join(ROOT_DIR, "services", "rule-service"),
        "port": 8003,
        "app": "main:app"
    },
    {
        "name": "Explanation Service",
        "dir": os.path.join(ROOT_DIR, "services", "explanation-service"),
        "port": 8004,
        "app": "main:app"
    },
    {
        "name": "Audit Service",
        "dir": os.path.join(ROOT_DIR, "services", "audit-service"),
        "port": 8005,
        "app": "main:app"
    },
    {
        "name": "Fairness Service",
        "dir": os.path.join(ROOT_DIR, "services", "fairness-service"),
        "port": 8006,
        "app": "main:app"
    },
    {
        "name": "API Gateway",
        "dir": os.path.join(ROOT_DIR, "gateway"),
        "port": GATEWAY_PORT,
        "app": "main:app"
    }
]

def main():
    print("=" * 70)
    print("        LAUNCHING SAHAJCREDIT BACKEND MICROSERVICES")
    print("=" * 70)
    print(f"Using Python: {PYTHON_EXEC}\n")

    processes = []

    try:
        for svc in SERVICES:
            print(f"[+] Starting {svc['name']:<25} on http://localhost:{svc['port']}...")
            env = os.environ.copy()
            env["PYTHONPATH"] = svc["dir"] + os.pathsep + env.get("PYTHONPATH", "")

            cmd = [
                PYTHON_EXEC,
                "-m", "uvicorn",
                svc["app"],
                "--host", "0.0.0.0",
                "--port", str(svc["port"])
            ]

            p = subprocess.Popen(
                cmd,
                cwd=svc["dir"],
                env=env
            )
            processes.append((svc["name"], p, svc["port"]))
            time.sleep(0.4)

        print("\n" + "=" * 70)
        print("          ALL 7 BACKEND SERVICES ARE RUNNING!")
        print("=" * 70)
        print(f"  - API Gateway:          http://0.0.0.0:{GATEWAY_PORT}  (Swagger: http://0.0.0.0:{GATEWAY_PORT}/docs)")
        print("  - Application Service:  http://localhost:8001  (Swagger: http://localhost:8001/docs)")
        print("  - Credit Engine:        http://localhost:8002  (Swagger: http://localhost:8002/docs)")
        print("  - Rule Service:         http://localhost:8003  (Swagger: http://localhost:8003/docs)")
        print("  - Explanation Service:  http://localhost:8004  (Swagger: http://localhost:8004/docs)")
        print("  - Audit Service:        http://localhost:8005  (Swagger: http://localhost:8005/docs)")
        print("  - Fairness Service:     http://localhost:8006  (Swagger: http://localhost:8006/docs)")
        print("=" * 70)
        print("\nPress Ctrl+C or send SIGTERM to stop all backend services cleanly.\n")

        def shutdown_handler(signum, frame):
            print("\nShutting down all backend microservices...")
            for name, p, port in processes:
                p.terminate()
                try:
                    p.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    p.kill()
            print("[OK] All backend services stopped.")
            sys.exit(0)

        # Register signal handlers
        try:
            signal.signal(signal.SIGTERM, shutdown_handler)
            signal.signal(signal.SIGINT, shutdown_handler)
        except (ValueError, AttributeError):
            pass

        # Keep alive and monitor
        while True:
            for name, p, port in processes:
                poll = p.poll()
                if poll is not None:
                    print(f"[!] Warning: {name} (port {port}) exited with code {poll}")
            time.sleep(2)

    except (KeyboardInterrupt, SystemExit):
        for name, p, port in processes:
            try:
                p.terminate()
                p.wait(timeout=2)
            except Exception:
                p.kill()
        print("[OK] All backend services stopped.")

if __name__ == "__main__":
    main()
