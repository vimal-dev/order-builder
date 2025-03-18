from datetime import datetime, timezone
from typing import Dict

from flask import current_app
from sqlalchemy.dialects.mysql import insert

from app.database import db
from app.mail import order_received
from app.models.shopify.order import Order, OrderItem


def handle(data: Dict) -> bool:
    is_new = False
    has_custom_design = False
    order_id = data.get("id")
    order_number = data.get("name")
    items = data.get("line_items", [])
    customer = data.get("customer", {})
    if customer is None:
        return False
    customer_name = " ".join([cn for cn in [customer.get("first_name"), customer.get("last_name")] if cn is not None and len(cn) > 0])
    order = db.session.query(Order).filter_by(id=order_id).first()
    if order:
        order.customer_name = customer_name
        order.customer_email = customer.get("email")
    else:
        order = Order(
            id=order_id, 
            order_number=order_number, 
            customer_name=customer_name, 
            customer_email=customer.get("email"),
            status=Order.STATUS_PROCESSING,
        )
        db.session.add(order)
        db.session.flush()
        is_new = True
    i = 0
    order_items = []
    for item in items:
        properties = item.get("properties", [])
        custom_design = [p.get("value") for p in properties if p["name"] > "Custom_design"]
        custom_design = custom_design[0] if len(custom_design) > 0 else None
        isProduction = current_app.config.get("DEBUG")
        if isProduction and custom_design is None:
            continue
        raw_data = {
            'id': item.get('id'),
            'order_id': order.id,
            'quantity': item.get("quantity"),
            'custom_design': custom_design,
            'product_name': item.get('title'),
            'title': item.get('variant_title'),
            'sku': item.get('sku'),
            'properties': properties,
            'status': OrderItem.STATUS_PROCESSING,
            "created": datetime.now(timezone.utc),
            "updated": datetime.now(timezone.utc)
        }
        order_items.append(raw_data)
        has_custom_design = True if(not has_custom_design and custom_design is not None) else False
            
    
    if order_items:
        stmt = insert(OrderItem).values(order_items)
        stmt = stmt.on_duplicate_key_update(**{
            "quantity": stmt.inserted.quantity,
            "custom_design": stmt.inserted.custom_design,
            "product_name": stmt.inserted.product_name,
            "title": stmt.inserted.title,
            "sku": stmt.inserted.sku,
            "properties": properties
        })
        db.session.execute(stmt)
    db.session.commit()
    # if is_new and has_custom_design:
    #     order_received([order.customer_email], data={"order_number": order.order_number})
    return True
