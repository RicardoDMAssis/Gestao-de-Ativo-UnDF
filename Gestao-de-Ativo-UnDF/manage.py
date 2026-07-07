#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def kill_port(port):
    import subprocess
    try:
        # Find PID on port
        output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode('utf-8', errors='ignore')
        pids = set()
        for line in output.strip().split('\n'):
            parts = line.split()
            if len(parts) >= 5:
                pid = parts[-1]
                if pid.isdigit() and int(pid) > 0:
                    pids.add(int(pid))
        
        my_pid = os.getpid()
        for pid in pids:
            if pid != my_pid:
                print(f"Porta {port} ocupada pelo PID {pid}. Finalizando processo...")
                subprocess.call(f'taskkill /F /PID {pid}', shell=True)
    except Exception:
        pass


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    if len(sys.argv) > 1 and sys.argv[1] == 'runserver':
        port = '8000'
        for arg in sys.argv[2:]:
            if not arg.startswith('-'):
                if ':' in arg:
                    port = arg.split(':')[-1]
                elif arg.isdigit():
                    port = arg
        kill_port(port)

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
