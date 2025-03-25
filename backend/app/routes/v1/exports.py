
from datetime import datetime
from flask import Blueprint, Response, current_app, json, jsonify, request, stream_with_context
from marshmallow import ValidationError
from sqlalchemy import and_, desc, select

from app.database import db
from app.models.user import User
from app.schemas.export import ExportOrdersSchema
from app.services.auth import token_required
from app.helpers.filters import build_filters
from app.helpers.common import decode_next_token, encode_next_token
from app.models.export import Export
from app.services.storage import get_spaces_client
from app.tasks import export_orders
from app.validators.file import get_extension


router = Blueprint("exports", __name__, url_prefix="exports")


def serialize_export(export: Export):
    bucket_name = current_app.config.get("AWS_S3_BUCKET")
    endpoint = current_app.config.get("AWS_ENDPOINT_URL")
    url = None
    ext = None
    if(export.status == Export.STATUS_COMPLETED):
        ext = get_extension(export.file)
        url = f"{endpoint}/{bucket_name}/exports/{export.file}"
    return {
        "id": export.id,
        "file": export.file,
        "url": url,
        "ext": ext,
        "status": export.status,
        "message": export.message,
        "created": export.created.isoformat(),
        "updated": export.updated.isoformat(),
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

    query = select(Export)

    query = query.filter(and_(*conditions))

    # Apply cursor-based pagination
    if "token" in options:
        if descending:
            query = query.where(Export.created < datetime.fromisoformat(options["token"]))
        else:
            query = query.where(Export.created > datetime.fromisoformat(options["token"]))

    # Order and limit results
    order_by_column = desc(Export.created) if descending else asc(Export.created)
    query = query.order_by(order_by_column).limit(limit)
    results = db.session.execute(query).scalars().all()
    has_next = len(results) >= limit
    response["data"]["items"] =  [serialize_export(export) for export in results]
    response["data"]["has_next"] = has_next
    if has_next:
        next_cursor = results[-1].created.isoformat() if results else None
        options["token"] = next_cursor
        response["data"]["next_token"] = encode_next_token(options)
    return jsonify(response), response["code"]


@router.route('/create', methods=['POST'])
@token_required
def create(current_user: User):
    response = {
        "code": 202,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    data = request.get_json()
    try:
        data = ExportOrdersSchema().load(data)
        data.update({
            "status": Export.STATUS_QUEUED,
            "user_id": current_user.id
        })
        export = Export(**data)
        db.session.add(export)
        db.session.flush()
        db.session.commit()
        if export.id:
            #export_orders.delay(export.id)
            export_orders.apply_async((export.id,), countdown=10)
        response["code"] = 202
        response["message"] = "Queued Successfully"
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"
    return jsonify(response), response["code"]


@router.route('/download/<int:id>', methods=['GET'])
@token_required
def download(current_user: User, id):
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    export = db.session.query(Export).filter_by(id=id).first()
    if export is None or export.status != Export.STATUS_COMPLETED:
        response["code"] = 404
        response["message"] = "Not Found"
    
    bucket_name = current_app.config.get("AWS_S3_BUCKET")
    return Response(
        stream_with_context(stream_s3_file(bucket_name, export.file)),
        content_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="exported-data.xlsx"'}
    )


# Function to stream file from S3
def stream_s3_file(bucket_name, key):
    spaces_client = get_spaces_client()
    
    s3_object = spaces_client.get_object(Bucket=bucket_name, Key=key)
    return s3_object["Body"]
    # print(body)
    # def generate():
    #     for chunk in iter(lambda: body.read(4096), b""):
    #         yield chunk

    # return generate