"""
MarketGrid Control Center - first safe iteration.
Monitors local ports and runs existing project tests/builds.
It does not start/stop processes or access database credentials yet.
"""
from __future__ import annotations

import os
import re
import socket
import subprocess
import threading
import time
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, simpledialog, ttk
import webbrowser

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"

SERVICES = [
    ("Eureka", 8761),
    ("API Gateway", 8080),
    ("User Service", 8081),
    ("Vendor Service", 8082),
    ("Product Service", 8083),
    ("Order Service", 8084),
    ("Payment Service", 8085),
    ("Tenant Service", 8086),
    ("React Frontend", 5173),
]

SECRET_PATTERN = re.compile(
    r"(?i)(password|secret|token|api[_-]?key)\s*([=:]\s*|\s+)([^\s,;]+)"
)


def safe_log(text: str) -> str:
    """Redact common secret assignments before showing command output."""
    return SECRET_PATTERN.sub(lambda m: f"{m.group(1)}{m.group(2)}[REDACTED]", text)


def port_is_open(port: int, timeout: float = 0.7) -> bool:
    """Check IPv4 and IPv6 loopback because Vite may bind only to ::1."""
    for host in ("127.0.0.1", "::1"):
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except OSError:
            continue
    return False


def find_maven() -> Path | None:
    wrapper_root = Path.home() / ".m2" / "wrapper" / "dists"
    if not wrapper_root.exists():
        return None
    candidates = list(wrapper_root.glob("apache-maven-3.9.16/**/bin/mvn.cmd"))
    return candidates[0] if candidates else None


class ControlCenter(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("MarketGrid Commerce — Control Center")
        self.geometry("900x650")
        self.minsize(760, 520)
        self.configure(padx=16, pady=14)
        self.managed_processes = {}
        self.busy = False

        ttk.Label(
            self, text="MarketGrid Control Center",
            font=("Segoe UI", 19, "bold")
        ).pack(anchor="w")
        ttk.Label(
            self,
            text="Local monitoring and validation • no cloud deployment • no credential display",
        ).pack(anchor="w", pady=(2, 12))

        buttons = ttk.Frame(self)
        buttons.pack(fill="x", pady=(0, 10))
        ttk.Button(buttons, text="Start All", command=self.start_all).pack(side="left", padx=(0, 7))
        ttk.Button(buttons, text="Stop All", command=self.stop_all).pack(side="left", padx=7)
        ttk.Button(buttons, text="Check Status", command=self.refresh_status).pack(side="left", padx=7)
        ttk.Button(buttons, text="Run Backend Tests", command=self.run_backend_tests).pack(side="left", padx=7)
        ttk.Button(buttons, text="Build Frontend", command=self.build_frontend).pack(side="left", padx=7)
        ttk.Button(buttons, text="Open Frontend", command=lambda: webbrowser.open("http://localhost:5173")).pack(side="left", padx=7)
        ttk.Button(buttons, text="Open API Gateway", command=lambda: webbrowser.open("http://localhost:8080")).pack(side="left", padx=7)

        self.table = ttk.Treeview(self, columns=("port", "status"), show="headings", height=9)
        self.table.heading("port", text="Port")
        self.table.heading("status", text="TCP Status")
        self.table.column("port", width=90, anchor="center")
        self.table.column("status", width=140, anchor="center")
        self.table.pack(fill="x", pady=(0, 10))
        for name, port in SERVICES:
            self.table.insert("", "end", iid=str(port), values=(port, "Checking…"))

        ttk.Label(self, text="Activity log", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        self.log = tk.Text(self, height=14, wrap="word", state="disabled")
        self.log.pack(fill="both", expand=True, pady=(5, 0))
        self.write_log(f"Project folder: {ROOT}")
        self.write_log("Managed mode: Start All skips existing services; Stop All targets only processes launched here.")
        self.refresh_status()

    def write_log(self, message: str) -> None:
        self.log.configure(state="normal")
        self.log.insert("end", safe_log(message.rstrip()) + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    def refresh_status(self) -> None:
        def worker() -> None:
            results = [(name, port, port_is_open(port)) for name, port in SERVICES]
            def update_ui() -> None:
                for name, port, is_open in results:
                    self.table.set(str(port), "status", "LISTENING" if is_open else "NOT RUNNING")
                up = sum(1 for _, _, state in results if state)
                self.write_log(f"Status check complete: {up}/{len(SERVICES)} ports listening.")
            self.after(0, update_ui)
        threading.Thread(target=worker, daemon=True).start()


    def start_all(self) -> None:
        if self.busy:
            messagebox.showinfo("Busy", "Wait for the current operation to finish.")
            return
        maven = find_maven()
        if not maven:
            messagebox.showerror("Maven not found", "Maven 3.9.16 was not found in your .m2 wrapper folder.")
            return
        env = os.environ.copy()
        for key, label in [("DB_PASSWORD", "Database password"), ("JWT_SECRET", "JWT signing secret"), ("APP_PROVISIONING_SECRET", "Provisioning secret")]:
            if not env.get(key):
                value = simpledialog.askstring("Startup configuration", f"Enter {label} ({key}):", show="*", parent=self)
                if value is None:
                    self.write_log("Start All cancelled; no services were launched.")
                    return
                if not value.strip():
                    messagebox.showerror("Missing configuration", f"{key} cannot be empty.")
                    return
                env[key] = value
        definitions = [
            ("Eureka", 8761, BACKEND / "eureka-server", True),
            ("Tenant Service", 8086, BACKEND / "tenant-service", True),
            ("User Service", 8081, BACKEND / "user-service", True),
            ("Vendor Service", 8082, BACKEND / "vendor-service", True),
            ("Product Service", 8083, BACKEND / "product-service", True),
            ("Order Service", 8084, BACKEND / "order-service", True),
            ("Payment Service", 8085, BACKEND / "payment-service", True),
            ("API Gateway", 8080, BACKEND / "api-gateway", True),
            ("React Frontend", 5173, FRONTEND, False),
        ]
        for name, port, folder, is_backend in definitions:
            if is_backend and not (folder / "pom.xml").is_file():
                messagebox.showerror("Missing service", f"Missing pom.xml: {folder}")
                return
        if not (FRONTEND / "package.json").is_file():
            messagebox.showerror("Missing frontend", f"Missing {FRONTEND / 'package.json'}")
            return
        self.busy = True
        self.write_log("Start All requested. Existing listening services will be skipped.")
        threading.Thread(target=self._start_worker, args=(definitions, maven, env), daemon=True).start()

    def _start_worker(self, definitions, maven, env):
        try:
            for name, port, folder, is_backend in definitions:
                if port_is_open(port):
                    self.after(0, lambda name=name, port=port: self.write_log(f"{name}: already listening on {port}; skipped."))
                    continue
                if is_backend:
                    command = [os.environ.get("ComSpec", "cmd.exe"), "/d", "/s", "/c", '"' + str(maven) + '" -B -ntp spring-boot:run']
                else:
                    command = [os.environ.get("ComSpec", "cmd.exe"), "/d", "/s", "/c", "npm run dev -- --host localhost"]
                try:
                    proc = subprocess.Popen(command, cwd=str(folder), env=env, shell=False, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors="replace", creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0))
                except Exception as exc:
                    self.after(0, lambda name=name, exc=exc: self.write_log(f"{name}: launch failed ({type(exc).__name__})."))
                    continue
                self.managed_processes[name] = proc
                threading.Thread(target=self._read_output, args=(name, proc), daemon=True).start()
                self.after(0, lambda name=name, port=port, pid=proc.pid: self.write_log(f"{name}: launched PID {pid}; waiting for port {port}."))
                deadline = time.monotonic() + (60 if is_backend else 25)
                while time.monotonic() < deadline:
                    if port_is_open(port):
                        self.after(0, lambda name=name, port=port: self.write_log(f"{name}: listening on port {port}."))
                        break
                    if proc.poll() is not None:
                        self.after(0, lambda name=name: self.write_log(f"{name}: launcher exited before port became available; inspect logs."))
                        break
                    time.sleep(1)
                else:
                    self.after(0, lambda name=name, port=port: self.write_log(f"{name}: startup timed out on port {port}; continuing."))
            self.after(0, self.refresh_status)
            self.after(0, lambda: self.write_log("Start All sequence finished."))
        finally:
            self.after(0, self._idle)

    def _read_output(self, name, proc):
        if proc.stdout is not None:
            for line in proc.stdout:
                self.after(0, lambda line=line, name=name: self.write_log(f"[{name}] {line.rstrip()}"))

    def _idle(self):
        self.busy = False

    def stop_all(self) -> None:
        if self.busy:
            messagebox.showinfo("Busy", "Wait for the current operation to finish.")
            return
        active = [(name, proc) for name, proc in self.managed_processes.items() if proc.poll() is None]
        if not active:
            messagebox.showinfo("Nothing to stop", "No running services were launched by this Control Center. Services started elsewhere were left untouched.")
            self.write_log("Stop All: no managed processes to stop; independent services untouched.")
            return
        if not messagebox.askyesno("Confirm Stop All", f"Stop {len(active)} process tree(s) launched by this Control Center? Independently started services will not be targeted."):
            return
        self.busy = True
        threading.Thread(target=self._stop_worker, args=(active,), daemon=True).start()

    def _stop_worker(self, active):
        try:
            for name, proc in reversed(active):
                if proc.poll() is None:
                    try:
                        subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True, text=True, timeout=15, check=False)
                        self.after(0, lambda name=name, pid=proc.pid: self.write_log(f"{name}: stop requested for managed process tree PID {pid}."))
                    except Exception as exc:
                        self.after(0, lambda name=name, exc=exc: self.write_log(f"{name}: stop request failed ({type(exc).__name__})."))
            time.sleep(1)
            self.after(0, self.refresh_status)
            self.after(0, lambda: self.write_log("Stop All finished; independently started services were not targeted."))
        finally:
            self.after(0, self._idle)

    def run_commands(self, title: str, commands: list[tuple[str, list[str], Path]]) -> None:
        def worker() -> None:
            self.after(0, lambda: self.write_log(f"\n=== {title} started ==="))
            failed = False
            for label, command, cwd in commands:
                self.after(0, lambda label=label: self.write_log(f"\n--- {label} ---"))
                try:
                    process = subprocess.Popen(
                        command, cwd=str(cwd), stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT, text=True, errors="replace",
                        env=os.environ.copy(), shell=False,
                    )
                    assert process.stdout is not None
                    for line in process.stdout:
                        self.after(0, lambda line=line: self.write_log(line))
                    code = process.wait()
                    if code != 0:
                        failed = True
                        self.after(0, lambda label=label, code=code: self.write_log(f"{label} FAILED (exit {code})"))
                    else:
                        self.after(0, lambda label=label: self.write_log(f"{label} PASSED"))
                except Exception as exc:
                    failed = True
                    self.after(0, lambda label=label, exc=exc: self.write_log(f"{label}: could not run ({type(exc).__name__}). Check paths and installed tools."))
            result = "finished with failures" if failed else "completed successfully"
            self.after(0, lambda: self.write_log(f"=== {title} {result} ==="))
            self.after(0, lambda: messagebox.showinfo(title, f"{title} {result}. See Activity log for details."))
        threading.Thread(target=worker, daemon=True).start()

    def run_backend_tests(self) -> None:
        maven = find_maven()
        if not maven:
            messagebox.showerror(
                "Maven not found",
                "Could not find Maven 3.9.16 under your user .m2 wrapper folder. No command was run.",
            )
            return
        service_names = [
            "user-service", "tenant-service", "vendor-service",
            "product-service", "order-service", "payment-service",
        ]
        commands = []
        for service in service_names:
            folder = BACKEND / service
            if (folder / "pom.xml").is_file():
                commands.append((f"{service} tests", [str(maven), "-B", "-ntp", "test"], folder))
            else:
                self.write_log(f"Skipped {service}: pom.xml not found.")
        if not commands:
            messagebox.showerror("No services found", "No service pom.xml files were found under backend.")
            return
        self.run_commands("Backend tests", commands)

    def build_frontend(self) -> None:
        package_file = FRONTEND / "package.json"
        if not package_file.is_file():
            messagebox.showerror("Frontend not found", f"Missing {package_file}")
            return
        npm = os.environ.get("ComSpec", "cmd.exe")
        self.run_commands("Frontend build", [("npm run build", [npm, "/d", "/s", "/c", "npm run build"], FRONTEND)])


if __name__ == "__main__":
    if not BACKEND.is_dir() or not FRONTEND.is_dir():
        raise SystemExit("Run this tool from its repository location: tools/marketgrid-control-center.py")
    ControlCenter().mainloop()
