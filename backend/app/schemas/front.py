

from marshmallow import Schema, fields
from marshmallow.validate import OneOf


class OrderDetailsSchema(Schema):
    order_number = fields.String(required=True)
    email = fields.Email(required=True)


class UpdateAttachmentSchema(Schema):
    status = fields.String(required=True, validate=OneOf(["Accept", "Revision"]))
    comment = fields.String(load_default=None)