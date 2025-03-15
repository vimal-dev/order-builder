from flask import Blueprint, current_app, jsonify, request
from marshmallow import ValidationError
from sqlalchemy import desc, select

from app.database import db
from app.models.shopify.order import Attachment, Order, OrderItem
from app.validators.file import get_extension
from app.schemas.front import OrderDetailsSchema, UpdateAttachmentSchema

router = Blueprint("front", __name__, url_prefix="o")

def serialize_order(order: Order):
    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "status": order.status,
        "updated": order.updated.isoformat()
    }

def serialize_order_items(item: OrderItem):
    return {
        "id": item.id,
        "product_name": item.product_name,
        "title": item.title,
        "sku": item.sku,
        "properties": item.properties,
        "quantity": item.quantity,
        "status": item.status,
        "custom_design": item.custom_design,
        "updated": item.updated.isoformat(),
    }

def serialize_attachment(attachment: Attachment):
    bucket_name = current_app.config.get("AWS_S3_BUCKET")
    endpoint = current_app.config.get("AWS_ENDPOINT_URL")
    url = f"{endpoint}/{bucket_name}/{attachment.file}"
    return {
        "id": attachment.id,
        #"order_item_id": attachment.order_item_id,
        "name": attachment.name,
        "file": attachment.file,
        "url": url,
        "ext": get_extension(attachment.file),
        "status": attachment.status,
        "comment": attachment.comment,
        "created": attachment.created.isoformat(),
        "updated": attachment.updated.isoformat(),
    }


@router.route('/details', methods=['POST'])
def get_order():
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }

    data = request.get_json()
    try:
        data = OrderDetailsSchema().load(data)
        order = db.session.query(Order).filter_by(order_number=data.get("order_number"), customer_email=data.get("email")).first()
        if order is None:
            response["code"] = 404
            response["message"] = "Not Found"
        order_obj = serialize_order(order)
        order_obj["order_items"] = [serialize_order_items(i) for i in order.order_items]
        response["data"] = order_obj
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"
    return jsonify(response), response["code"]

@router.route('/attachment/update/<item_id>/<attachment_id>', methods=['POST', 'PUT'])
def update_attachment(item_id, attachment_id):
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }

    data = request.get_json()
    try:
        data = UpdateAttachmentSchema().load(data)
        attachment = db.session.query(Attachment).filter_by(id=attachment_id, order_item_id=item_id).first()
        if attachment is None:
            response["code"] = 404
            response["message"] = "Attachment not found"

        match(data.get("status")):
            case "Accept":
                attachment.status = Attachment.STATUS_DESIGN_APPROVED
            case "Revision":
                attachment.status = Attachment.STATUS_REVISION_REQUESTED
            case _:
                current_app.logger.info("Invalid status requested")
        attachment.comment = data.get("comment")
        db.session.commit()
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"

    
    return jsonify(response), response["code"]


@router.route('/attachments/<item_id>', methods=['GET'])
def attachments(item_id):
    limit = request.args.get("limit", current_app.config.get("RECORDS_LIMIT"), type=int)
    response = {
        "code": 200,
        'message': 'Working!',
        "data": {
            "items": None,
            "next_cursor": None
        },
        "errors": {},
    }
    query = select(Attachment)
    query = query.where(Attachment.order_item_id == item_id)
    # Order and limit results
    order_by_column = desc(Attachment.id)
    query = query.order_by(order_by_column).limit(limit)

    results = db.session.execute(query).scalars().all()

    # Prepare next cursor
    next_cursor = results[-1].id if results else None
    response["data"]["items"] =  [serialize_attachment(attachment) for attachment in results]
    response["data"]["next_cursor"] = next_cursor
    return jsonify(response), response["code"]