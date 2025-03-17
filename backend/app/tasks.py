from flask import current_app as flask_app
from celery import shared_task

from app.database import db
from app.mailers.order_received import order_received_mailer
from app.models.export import Export
from app.services.storage import get_spaces_client

@shared_task(ignore_result=True)
def example_task():
    return "Celery task executed!"


@shared_task(ignore_result=True)
def trigger_order_received_mail():
    """Sends first order update after 3 days to customer"""
    order_received_mailer.handle()
    return "Order Received task executed!"

@shared_task(ignore_result=True)
def export_orders(export_id: int):
    export = db.session.query(Export).filter_by(id=export_id).first()
    try:
        if export:
            export.status = Export.STATUS_PROCESSING
            export.message = None
            db.session.commit()

            spaces_client = get_spaces_client()
            bucket_name = flask_app.config.get("AWS_S3_BUCKET")
            endpoint = flask_app.config.get("AWS_ENDPOINT_URL")
            filename = f"exports/{export.id}.csv"
            spaces_client.put_object(
                Bucket=bucket_name,
                Key=filename,
                Body="Demo, Oma",
                ACL="private",
                ContentType="text/csv"
            )
            export.file = filename
            export.status = Export.STATUS_COMPLETED
            export.message = None
            db.session.commit()
    except Exception as e:
        if export:
            export.status = Export.STATUS_FAILED
            export.message = str(e)
            db.session.commit()
    
    return "Orders Exported"