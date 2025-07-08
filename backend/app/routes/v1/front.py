from flask import Blueprint, current_app, jsonify, request
from marshmallow import ValidationError
from sqlalchemy import desc, select

from app.database import db
from app.models.shopify.order import Attachment, Order, OrderItem
from app.validators.file import get_extension
from app.schemas.front import OrderDetailsSchema, UpdateAttachmentSchema
from app.tasks import order_item_updated
from app.mail import get_outlook_token, send_customer_order_approved, send_order_approved, send_order_revision_requested

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
    # bucket_name = current_app.config.get("AWS_S3_BUCKET")
    # endpoint = current_app.config.get("AWS_ENDPOINT_URL")
    # pdf_url = None
    # gift_url = None
    # if item.pdf_file:
    #     pdf_url = f"{endpoint}/{bucket_name}/{item.pdf_file}"
    # if item.gift_image:
    #     gift_url = f"{endpoint}/{bucket_name}/{item.gift_image}"
    return {
        "id": item.id,
        "title": item.title,
        "product_name": item.product_name,
        "sku": item.sku,
        "properties": item.properties,
        "quantity": item.quantity,
        "status": item.status,
        "custom_design": item.custom_design,
        # "pdf_url": pdf_url,
        # "gift_url": gift_url,
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
        order_number = data.get("order_number")
        order_number = f"#{order_number}" if order_number[0] != "#" else order_number
        order = db.session.query(Order).filter_by(order_number=order_number, customer_email=data.get("email")).first()
        if order is None:
            response["code"] = 404
            response["message"] = "Not Found"
            return jsonify(response), response["code"]
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
        order_item = db.session.query(OrderItem).filter_by(id=item_id).first()
        total_items = db.session.query(OrderItem).filter_by(order_id=order_item.order_id).count()
        attachment = db.session.query(Attachment).filter_by(id=attachment_id, order_item_id=item_id).first()
        if attachment is None:
            response["code"] = 404
            response["message"] = "Attachment not found"

        match(data.get("status")):
            case "Accept":
                order_item.status = OrderItem.STATUS_DESIGN_APPROVED
                if total_items == 1:
                    order_item.order.status = Order.STATUS_DESIGN_APPROVED
                attachment.status = Attachment.STATUS_DESIGN_APPROVED
            case "Revision":
                order_item.status = OrderItem.STATUS_REVISION_REQUESTED
                if total_items == 1:
                    order_item.order.status = Order.STATUS_REVISION_REQUESTED
                attachment.status = Attachment.STATUS_REVISION_REQUESTED
            case _:
                current_app.logger.info("Invalid status requested")
        attachment.comment = data.get("comment")
        db.session.commit()
        order_item_updated.delay(item_id)
        try:
            mail_data = {
                "order_number": order_item.order.order_number,
                "app_name": current_app.config.get("APP_NAME"),
                "item": {
                    "name": order_item.product_name,
                    "title": order_item.title
                },
                "comment": data.get("comment")
            }
            access_token = get_outlook_token()
            admin_email = "info@getloode.com"
            match(data.get("status")):
                case "Accept":
                    send_order_approved(access_token, admin_email, mail_data)
                    app_url = current_app.config.get("APP_URL")
                    if app_url:
                        app_url = app_url.strip("/")
                    mail_data = {
                        "order_number": order_item.order.order_number,
                        "app_name": current_app.config.get("APP_NAME"),
                        "customer_name": order_item.order.customer_name,
                        "customer_email": order_item.order.customer_email,
                        "url": f"{app_url}/order-details"
                    }
                    send_customer_order_approved(access_token, order_item.order.customer_email, data=mail_data)
                case "Revision":
                    send_order_revision_requested(access_token, admin_email, mail_data)
                case _:
                    pass
        except Exception as e:
            current_app.logger.error(str(e))   
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