#!/usr/bin/env sh

celery -A app.tasks worker --loglevel=INFO -Q default &
celery -A app.tasks beat --loglevel=INFO --schedule=/celerybeat/celerybeat-schedule
