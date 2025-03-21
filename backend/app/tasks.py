from datetime import datetime
from io import BytesIO
import os
from typing import List
from flask import current_app as flask_app
from celery import shared_task
import pandas as pd
from sqlalchemy import and_, desc, select, update

from app.database import db
from app.helpers.filters import build_filters
from app.mailers.order_received import order_received_mailer
from app.models.export import Export
from app.models.shopify.order import Order, OrderItem
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
def order_item_updated(order_item_id: int):
    """Update order and order item status on design approved"""
    # TODO: Update the status of the order item and parent order
    order_item = db.session.query(OrderItem).filter_by(id=order_item_id).first()
    isProductionReady = True
    for item in order_item.order.order_items:
        if item.status != OrderItem.STATUS_READY_FOR_PRODUCTION:
            isProductionReady = False
            break
    if isProductionReady:
        stmt = (
            update(Order).where(Order.id == order_item.order_id).values(status=OrderItem.STATUS_READY_FOR_PRODUCTION)
        )
        db.session.execute(stmt)
        db.session.commit()
    return f"Order Received task executed! {__name__}"

@shared_task(ignore_result=True)
def export_orders(export_id: int):
    export = db.session.query(Export).filter_by(id=export_id).first()
    try:
        if export:
            export.status = Export.STATUS_PROCESSING
            export.message = None
            db.session.commit()

            filters = export.export_options.get("filters", [])
            has_next = True
            cursor = None
            df = pd.DataFrame()
            while(has_next):
                items, cursor = get_orders(filters, cursor)
                has_next = cursor is not None
                itr_df = pd.DataFrame(items)
                df = pd.concat([df, itr_df], ignore_index=True)
            # xlsx_file = os.path.join(flask_app.config.get('UPLOAD_FOLDER'), filename)
            # df.to_excel('topic_posts.xlsx', index=False)

            # Save Excel to BytesIO
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name="Orders")

            output.seek(0)  # Move the cursor to the beginning
                


            spaces_client = get_spaces_client()
            bucket_name = flask_app.config.get("AWS_S3_BUCKET")
            endpoint = flask_app.config.get("AWS_ENDPOINT_URL")
            filename = f"exports/{export.id}.csv"

            spaces_client.upload_fileobj(
                output,
                bucket_name,
                filename,
                ExtraArgs={
                    "ACL": "private",
                    "ContentType": "application/vnd.ms-excel"
                }
            )
            
            export.file = filename
            export.status = Export.STATUS_COMPLETED
            export.message = None
            db.session.commit()
        else:
            return "Export Request Not found"
    except Exception as e:
        if export:
            export.status = Export.STATUS_FAILED
            export.message = str(e)
            db.session.commit()
    
    return "Orders Exported"



def get_orders(filters: List = [], cursor = None) ->  tuple[List, str | None]:
    limit = 100
    filter_column_types = {
        "created": "datetime"
    }
    conditions = build_filters(filters, filter_column_types)
    query = select(Order)
    query = query.filter(and_(*conditions))
    if cursor is not None:
        query = query.where(Order.created < datetime.fromisoformat(cursor))
    order_by_column = desc(Order.created)
    query = query.order_by(order_by_column).limit(limit)
    results = db.session.execute(query).scalars().all()
    has_next = len(results) >= limit
    cursor = results[-1].created.isoformat() if results and has_next else None
    items = []
    for order in results:
        order_items = serialize_order(order)
        if len(order_items):
            items = items + order_items
    return items, cursor


def serialize_order(order: Order) -> List[dict]:
    items = []
    bucket_name = flask_app.config.get("AWS_S3_BUCKET")
    endpoint = flask_app.config.get("AWS_ENDPOINT_URL")
    
    for oi in order.order_items:
        if oi.custom_design is not None:
            pdf_url = ""
            gift_url = ""
            if oi.pdf_file:
                pdf_url = f"{endpoint}/{bucket_name}/{oi.pdf_file}"
            if oi.gift_image:
                gift_url = f"{endpoint}/{bucket_name}/{oi.gift_image}"
            row = {
                "Order No.": order.order_number,
                "Name": oi.custom_design,
                "Status": oi.status,
                "Quantity": oi.quantity,
                "Material": oi.others["material"],
                "Chain Length": oi.others["chain_length"],
                "Birthstone Y/N": oi.others["birth_stone"],
                "Packaging Y/N": "",
                "Chain Type": oi.others["for"],
                "Version": "",
                "Style": "",
                "PDF Design Link": pdf_url,
                "Thank You Card Link": gift_url,
                "Colonna 1": "",
                "Start Produce Date": "",
                "Shipped": ""
            }
            items.append(row)
    return items