from celery import Celery, Task
from celery.schedules import crontab
from flask import Flask
from kombu import Queue

DAEMON_RUN_TIME_PERIOD_SECONDS = 1800.0  # 30 minutes


def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)
    celery_app = Celery(app.name, task_cls=FlaskTask, include=["app.tasks"])
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    celery_app.conf.task_queues = (
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
    # celery_app.conf.beat_schedule_filename = "/celerybeat/celerybeat-schedule"
    celery_app.conf.task_default_queue = "default"
    celery_app.conf.task_default_routing_key = "default"
    # app.conf.task_default_exchange = 'default'
    # app.conf.task_default_exchange_type = "direct"
    # celery_app.conf.beat_schedule = {
    #     "kpi-daily-at-midnight": {
    #         "task": "app.tasks.calculate_avg_for_day",
    #         "schedule": crontab(minute=1, hour=0),
    #     },
    #     "process-emails-periodic": {
    #         "task": "app.tasks.email_processing_daemon",
    #         "schedule": DAEMON_RUN_TIME_PERIOD_SECONDS
    #     }
    # }
    celery_app.conf.beat_schedule = {
        "send-order-received-after-3days": {
            "task": "app.tasks.trigger_order_received_mail",
            "schedule": crontab(minute="0", hour="*", day_of_week="*", day_of_month="*", month_of_year="*")
        }
    }

    celery_app.conf.timezone = "UTC"
    app.extensions["celery"] = celery_app
    return celery_app