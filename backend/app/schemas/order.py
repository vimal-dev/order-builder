


from marshmallow import Schema, fields
from marshmallow.validate import OneOf

from app.validators.file import FileField


class UpdateAttachmentSchema(Schema):
    status = fields.String(required=True, validate=OneOf(["accept", "revision", "reject"]))


class UploadAttachmentSchema(Schema):
    attached_file = FileField(
        required=True, 
        allow_none=True, 
        metadata={
            "allowed_extensions": ["pdf", "jpeg", "jpg", "png", "svg"]
        }
    )