


from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from http import HTTPStatus
from marshmallow import ValidationError
from sqlalchemy import asc, desc, select, update
import uuid
from werkzeug.utils import secure_filename

from app.database import db
from app.models.shopify.order import Attachment, Order, OrderItem
from app.models.user import User
from app.schemas.order import UpdateAttachmentSchema, UploadAttachmentSchema
from app.services.auth import token_required
from app.services.storage import get_spaces_client
from app.helpers.form import parse_nested_form_data
from app.validators.file import get_extension
from app.mail import send_customer_order_update, send_customer_order_revision


router = Blueprint("orders", __name__, url_prefix="orders")

def serialize_order(order: Order):
    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "status": order.status,
        "created": order.created.isoformat(),
        "updated": order.updated.isoformat()
    }

def serialize_order_items(item: OrderItem):
    return {
        "id": item.id,
        "title": item.title,
        "product_name": item.product_name,
        "sku": item.sku,
        "properties": item.properties,
        "quantity": item.quantity,
        "status": item.status,
        "custom_design": item.custom_design,
        "created": item.created.isoformat(),
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

@router.route('', methods=['GET'])
@token_required
def index(current_user: User):
    response = {
        "code": 200,
        'message': 'Working!',
        "data": {
            "items": None,
            "next_cursor": None
        },
        "errors": {},
    }
    limit = request.args.get("limit", current_app.config.get("RECORDS_LIMIT"), type=int)
    cursor = request.args.get("cursor", None, type=str)
    order_number = request.args.get("order_number", None, type=str)
    customer_email = request.args.get("customer_email", None, type=str)
    created_after = request.args.get("created_after", None, type=str)
    created_before = request.args.get("created_before", None, type=str)
    descending = request.args.get("descending", "true").lower() == "true"

    query = select(Order)

    # Apply filters
    if order_number:
        query = query.where(Order.order_number == order_number)
    if customer_email:
        query = query.where(Order.customer_email == customer_email)
    if created_after:
        query = query.where(Order.created >= datetime.fromisoformat(created_after))
    if created_before:
        query = query.where(Order.created <= datetime.fromisoformat(created_before))

    # Apply cursor-based pagination
    if cursor:
        if descending:
            query = query.where(Order.created < datetime.fromisoformat(cursor))
        else:
            query = query.where(Order.created > datetime.fromisoformat(cursor))

    # Order and limit results
    order_by_column = desc(Order.created) if descending else asc(Order.created)
    query = query.order_by(order_by_column).limit(limit)

    results = db.session.execute(query).scalars().all()
    
    # Prepare next cursor
    next_cursor = results[-1].created.isoformat() if results else None
    response["data"]["items"] =  [serialize_order(order) for order in results]
    response["data"]["next_cursor"] = next_cursor
    return jsonify(response), response["code"]


@router.route('/<id>', methods=['GET'])
@token_required
def view(current_user: User, id):
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    order = db.session.query(Order).filter_by(id=id).first()
    if order is None:
        response["code"] = 404
        response["message"] = "Not Found"
    order_obj = serialize_order(order)
    order_obj["order_items"] = [serialize_order_items(i) for i in order.order_items]
    response["data"] = order_obj
    # response["attachments"] = order.order_items.attachments
    return jsonify(response), response["code"]


@router.route('/attachments/<item_id>', methods=['GET'])
@token_required
def attachments(current_user: User, item_id):
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
    order_by_column = desc(Attachment.created)
    query = query.order_by(order_by_column).limit(limit)

    results = db.session.execute(query).scalars().all()

    # Prepare next cursor
    next_cursor = results[-1].created.isoformat() if results else None
    response["data"]["items"] =  [serialize_attachment(attachment) for attachment in results]
    response["data"]["next_cursor"] = next_cursor
    return jsonify(response), response["code"]


@router.route('/attachment/add/<item_id>', methods=['POST', 'PUT'])
@token_required
def add_attachment(current_user: User, item_id):
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }

    data = parse_nested_form_data(request)
    try:
        data = UploadAttachmentSchema().load(data)
        attached_file = data.get("attached_file")
        filename = f"{uuid.uuid4().hex}_{secure_filename(attached_file.filename)}"
        spaces_client = get_spaces_client()
        bucket_name = current_app.config.get("AWS_S3_BUCKET")
        endpoint = current_app.config.get("AWS_ENDPOINT_URL")
        try:
            order_item = db.session.query(OrderItem).filter_by(id=item_id).first()
            spaces_client.upload_fileobj(
                attached_file,
                bucket_name,
                filename,
                ExtraArgs={
                    "ACL": "public-read",
                    "ContentType": attached_file.content_type
                }
            )
            
            attachment_model = Attachment(**{
                "name": attached_file.filename,
                "order_item_id": item_id,
                "file": filename,
                "status": Attachment.STATUS_WAITING_FOR_APPROVAL
            })
            db.session.add(attachment_model)
            db.session.flush()
            if attachment_model.id:
                stmt_upd = update(Attachment).values(status=Attachment.STATUS_REVISION_REQUESTED).where(Attachment.status == Attachment.STATUS_WAITING_FOR_APPROVAL, Attachment.order_item_id == item_id, Attachment.id != attachment_model.id)
                db.session.execute(stmt_upd)
            db.session.commit()
            app_url = current_app.config.get("APP_URL")
            if app_url:
                app_url = app_url.strip("/")
            mail_data = {
                "app_name": current_app.config.get("APP_NAME"),
                "customer_name": order_item.order.customer_name,
                "url": f"{app_url}/order-details"
            }
            if order_item.order.mail_sent:
                send_customer_order_revision([order_item.order.customer_email], data=mail_data)
            else:
                send_customer_order_update([order_item.order.customer_email], data=mail_data)
            response["code"] = HTTPStatus.CREATED
        except Exception as e:
            raise ValidationError(f"Failed to upload image: {e}")
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"

    
    return jsonify(response), response["code"]


@router.route('/attachment/update/<attachment_id>', methods=['POST', 'PUT'])
@token_required
def update_attachment(current_user: User, attachment_id):
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }

    data = request.get_json()
    try:
        data = UpdateAttachmentSchema().load(data)
        attachment = db.session.query(Attachment).filter_by(id=attachment_id).first()
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


@router.route('/attachment/delete/<attachment_id>', methods=['POST', 'DELETE'])
@token_required
def delete_attachment(current_user: User, attachment_id):
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }

    attachment = db.session.query(Attachment).filter_by(id=attachment_id).first()
    if attachment is None:
        response["code"] = 404
        response["message"] = "Attachment not found"

    db.session.delete(attachment)
    db.session.commit()

    
    return jsonify(response), response["code"]