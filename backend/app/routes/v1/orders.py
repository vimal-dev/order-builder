


from datetime import datetime
from flask import Blueprint, json, jsonify, request, current_app
from http import HTTPStatus
from marshmallow import ValidationError
from sqlalchemy import and_, asc, desc, select, update
import uuid
from werkzeug.utils import secure_filename

from app.database import db
from app.models.shopify.order import Attachment, Order, OrderItem
from app.models.user import User
from app.schemas.order import UpdateAttachmentSchema, UploadAttachmentSchema, UploadPdfOrGiftSchema
from app.services.auth import token_required
from app.services.storage import get_spaces_client
from app.helpers.form import parse_nested_form_data
from app.validators.file import get_extension
from app.mail import get_outlook_token, send_customer_order_update, send_customer_order_revision
from app.helpers.filters import build_filters
from app.helpers.common import decode_next_token, encode_next_token
from app.tasks import order_item_updated


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
    bucket_name = current_app.config.get("AWS_S3_BUCKET")
    endpoint = current_app.config.get("AWS_ENDPOINT_URL")
    pdf_url = None
    gift_url = None
    if item.pdf_file:
        pdf_url = f"{endpoint}/{bucket_name}/{item.pdf_file}"
    if item.gift_image:
        gift_url = f"{endpoint}/{bucket_name}/{item.gift_image}"
    return {
        "id": item.id,
        "title": item.title,
        "product_name": item.product_name,
        "sku": item.sku,
        "properties": item.properties,
        "quantity": item.quantity,
        "status": item.status,
        "custom_design": item.custom_design,
        "pdf_url": pdf_url,
        "gift_url": gift_url,
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
            "next_token": None,
            "has_next": False
        },
        "errors": {},
    }

    filters = json.loads(request.args.get("f", "[]"))
    # sorting = json.loads(request.args.get("s", "[]"))
    filter_column_types = {
        "created": "datetime"
    }
    conditions = build_filters(filters, filter_column_types)

    limit = request.args.get("limit", current_app.config.get("RECORDS_LIMIT"), type=int)
    next_token = request.args.get("next_token", None, type=str)

    options = {}
    if next_token:
        options = decode_next_token(next_token)
    descending = request.args.get("descending", "true").lower() == "true"

    query = select(Order)

    query = query.filter(and_(*conditions))

    # Apply cursor-based pagination
    if "token" in options:
        if descending:
            query = query.where(Order.id < options["token"])
            #query = query.where(Order.created < datetime.fromisoformat(options["token"]))
        else:
            query = query.where(Order.id > options["token"])
            #query = query.where(Order.created > datetime.fromisoformat(options["token"]))

    # Order and limit results
    order_by_column = desc(Order.id) if descending else asc(Order.id)
    #order_by_column = desc(Order.created) if descending else asc(Order.created)
    query = query.order_by(order_by_column).limit(limit)
    results = db.session.execute(query).scalars().all()
    has_next = len(results) >= limit
    response["data"]["items"] =  [serialize_order(order) for order in results]
    response["data"]["has_next"] = has_next
    if has_next:
        next_cursor = results[-1].id if results else None
        options["token"] = next_cursor
        response["data"]["next_token"] = encode_next_token(options)
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
            order_item.status = OrderItem.STATUS_WAITING_FOR_APPROVAL
            order_item.order.status = Order.STATUS_WAITING_FOR_APPROVAL
            db.session.flush()
            if attachment_model.id:
                stmt_upd = update(Attachment).values(status=Attachment.STATUS_REVISION_REQUESTED).where(Attachment.status == Attachment.STATUS_WAITING_FOR_APPROVAL, Attachment.order_item_id == item_id, Attachment.id != attachment_model.id)
                db.session.execute(stmt_upd)
            db.session.commit()
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
            access_token = get_outlook_token()
            if order_item.order.mail_sent:
                send_customer_order_revision(access_token, order_item.order.customer_email, data=mail_data)
            else:
                send_customer_order_update(access_token, order_item.order.customer_email, data=mail_data)
            response["code"] = HTTPStatus.CREATED
        except Exception as e:
            raise ValidationError(f"Failed to upload image: {e}")
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"

    
    return jsonify(response), response["code"]


@router.route('/dispatch/<item_id>', methods=['POST', 'PUT'])
@token_required
def add_pdf_and_gift_image(current_user: User, item_id):
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }

    data = parse_nested_form_data(request)
    try:
        data = UploadPdfOrGiftSchema().load(data)
        pdf_file = data.get("pdf_file")
        gift_file = data.get("gift_file")
        pdf_filename = f"{uuid.uuid4().hex}_{secure_filename(pdf_file.filename)}"
        gift_filename = f"{uuid.uuid4().hex}_{secure_filename(gift_file.filename)}"
        spaces_client = get_spaces_client()
        bucket_name = current_app.config.get("AWS_S3_BUCKET")
        endpoint = current_app.config.get("AWS_ENDPOINT_URL")
        try:
            order_item = db.session.query(OrderItem).filter_by(id=item_id).first()
            spaces_client.upload_fileobj(
                pdf_file,
                bucket_name,
                pdf_filename,
                ExtraArgs={
                    "ACL": "public-read",
                    "ContentType": pdf_file.content_type
                }
            )
            spaces_client.upload_fileobj(
                gift_file,
                bucket_name,
                gift_filename,
                ExtraArgs={
                    "ACL": "public-read",
                    "ContentType": gift_file.content_type
                }
            )
            order_item.pdf_file = pdf_filename
            order_item.gift_image = gift_filename
            order_item.status = OrderItem.STATUS_READY_FOR_PRODUCTION
            db.session.commit()
            order_item_updated.delay(item_id)
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