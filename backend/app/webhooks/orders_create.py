from datetime import datetime, timezone
from typing import Dict

from flask import current_app
from sqlalchemy.dialects.mysql import insert

from app.database import db
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

        birth_stone = [p.get("value") for p in properties if p["name"] > "Extra charm"]
        birth_stone = birth_stone[0] if len(birth_stone) > 0 else None

        variant_title = item.get("variant_title")
        material = chain_length = ""
        if variant_title:
            splitted_title = variant_title.split("/")
            if len(splitted_title) == 2:
                material, chain_length = splitted_title
        others = {
            "for": "Man" if item.get("product_id", None) == "8339432734870" else "Woman",
            "material": material,
            "chain_length": chain_length,
            "birth_stone": birth_stone
        }
        
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
            'others': others,
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
            "properties": properties,
            'others': others
        })
        db.session.execute(stmt)
    db.session.commit()
    return True
