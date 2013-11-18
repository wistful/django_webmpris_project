import multiprocessing
import os

PROJECT_PATH = "{{ PROJECT_PATH }}"

workers = multiprocessing.cpu_count()

bind = "{{ bind }}"

worker_class = "sync"

chdir = os.path.join(
    PROJECT_PATH,
    "src/{{ PROJECT_NAME }}")

accesslog = os.path.join(PROJECT_PATH, "logs/gunicorn_access.log")
errorlog = os.path.join(PROJECT_PATH, "logs/gunicorn_error.log")
loglevel = "info"
