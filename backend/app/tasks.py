
from flask import current_app
from app.celery import get_celery


celery = next(get_celery())

@celery.task(ignore_result=True)
def example_task():
    return "Celery task executed!"