# def make_celery(app):
#     celery = Celery(
#         app.import_name,
#         broker=app.config['CELERY_BROKER_URL'],
#         backend=app.config['CELERY_RESULT_BACKEND']
#     )
#     celery.conf.update(app.config)
    
#     class ContextTask(celery.Task):
#         """Ensure tasks have Flask app context."""
#         def __call__(self, *args, **kwargs):
#             with app.app_context():
#                 return super().__call__(*args, **kwargs)

#     celery.Task = ContextTask
#     return celery

# def make_celery(app: Flask) -> Celery:
#     with app.app_context(): 
#         class ContextTask(CeleryTask):
#             """Ensure tasks have Flask app context."""
#             def __call__(self, *args: object, **kwargs: object) -> object:
#                 with app.app_context():
#                     return self.run(*args, **kwargs)
#         celery = Celery(
#             app.import_name,
#             broker=app.config['CELERY_BROKER_URL'],
#             backend=app.config['CELERY_RESULT_BACKEND'],
#             task_cls=ContextTask
#         )
#         celery.conf.update(app.config)
#         celery.set_default()
#         # app.extensions["celery"] = celery
#         # celery.Task = ContextTask
#     return celery


# from celery import Celery
# from flask import Flask


# from flask import Flask


# def init_celery(app: Flask) -> None:
#     """Bind Celery instance to Flask app."""
#     celery = Celery(
#         app.import_name,
#         broker=app.config['CELERY_BROKER_URL'],
#         backend=app.config['CELERY_RESULT_BACKEND'],
#         #task_cls=ContextTask
#     )
#     celery.conf.update(app.config)

#     class ContextTask(celery.Task):
#         """Ensure Celery tasks run inside Flask app context."""
#         def __call__(self, *args, **kwargs):
#             with app.app_context():
#                 return super().__call__(*args, **kwargs)

#     celery.Task = ContextTask
#     return celery

from celery import Celery
from celery.schedules import crontab
from kombu import Queue

DAEMON_RUN_TIME_PERIOD_SECONDS = 1800.0  # 30 minutes

def get_celery():
    app = Celery(
        __name__,
        broker='redis://cache:6379/0',
        backend='redis://cache:6379/0',
        broker_connection_retry_on_startup=True,
        task_create_missing_queues=True,
    )
    app.conf.task_queues = (
        Queue("default", routing_key="default.#"),
        # Queue('dev', routing_key='dev.#'),
    )
    # app.conf.task_routes = {
    #     "app.tasks.calculate_avg_for_day": {"queue": "default"},
    #     "app.tasks.process_email_account": {"queue": "default"},
    #     "app.tasks.process_email": {"queue": "default"},
    #     "app.tasks.fetch_and_store_orders": {"queue": "default"},
    #     "app.tasks.email_processing_daemon": {"queue": "default"},
    # }
    app.conf.beat_schedule_filename = "/celerybeat/celerybeat-schedule"
    app.conf.task_default_queue = "default"
    app.conf.task_default_routing_key = "default"
    # app.conf.task_default_exchange = 'default'
    # app.conf.task_default_exchange_type = "direct"
    app.conf.beat_schedule = {
        "kpi-daily-at-midnight": {
            "task": "app.tasks.calculate_avg_for_day",
            "schedule": crontab(minute=1, hour=0),
        },
        "process-emails-periodic": {
            "task": "app.tasks.email_processing_daemon",
            "schedule": DAEMON_RUN_TIME_PERIOD_SECONDS
        }
    }

    app.conf.timezone = "UTC"
    try:
        yield app
    finally:
        app.close()