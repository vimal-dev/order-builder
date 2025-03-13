from marshmallow import Schema, fields
from marshmallow.validate import OneOf


class RegisterSchema(Schema):
    name = fields.String(required=True)
    email = fields.Email(required=True)


class LoginSchema(Schema):
    username = fields.String(required=True)


class LoginVerifySchema(Schema):
    username = fields.String(required=True)
    code = fields.String(required=True)


class RefreshTokenSchema(Schema):
    token = fields.String(required=True)