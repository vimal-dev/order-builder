from flask import current_app as flask_app
from celery import shared_task

from app.mailers.order_received import order_received_mailer

@shared_task(ignore_result=True)
def example_task():
    return "Celery task executed!"


@shared_task(ignore_result=True)
def trigger_order_received_mail():
    """Sends first order update after 3 days to customer"""
    order_received_mailer.handle()
    return "Order Received task executed!"