from datetime import datetime, timedelta, timezone
from typing import Dict, List
import click
from flask import current_app, render_template
from flask_mail import Message
from sqlalchemy import asc, or_, select, update
from app.database import db
from app.mail import get_mailer
from app.models.shopify.order import Order


def serialize_order(order: Order):
    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "created": order.created.isoformat(),
        "updated": order.updated.isoformat()
    }

class OrderReceived:

    def handle(self):
        has_next = True
        cursor = None
        while(has_next):
            orders, cursor = self.get_orders(cursor)
            has_next = cursor is not None
            total_orders = len(orders)
            click.echo(click.style(f"Order to process {total_orders}", fg="blue"))
            if len(orders):
                results = self.send_mail(orders)
                if len(results):
                    stmt_upd = update(Order).values(mail_sent = True).where(Order.id.in_(results))
                    db.session.execute(stmt_upd)
                    db.session.commit()

    def get_orders(self, cursor: None) -> tuple[List, str | None]:
        created_less_than = datetime.now(timezone.utc) - timedelta(days=3)
        query = select(Order) \
            .where(or_(Order.mail_sent == False, Order.mail_sent == None)) \
            .where(Order.created <= created_less_than)
        
        if cursor:
            query = query.where(Order.created > datetime.fromisoformat(cursor))

        query = query.order_by(asc(Order.created)) \
            .limit(100)
        print(query)
        results = db.session.execute(query).scalars().all()

        next_cursor = results[-1].created.isoformat() if results else None
        return [serialize_order(order) for order in results], next_cursor


    def send_mail(seld, orders: List[Dict]):
        result = []
        with current_app.app_context():
            mail = get_mailer()
            with mail.connect() as conn:
                for order in orders:
                    msg = Message("Order update",
                    recipients=[order.get("customer_email")])
                    data = {
                        "app_name": current_app.config.get("APP_NAME"),
                        "customer_name": order.get("customer_name"),
                    }
                    msg.html = render_template('emails/order-received.html', **data)
                    try:
                        conn.send(msg)
                        result.append(order.get("id"))
                    except Exception as e:
                        current_app.logger.error(str(e))
        return result


order_received_mailer = OrderReceived()