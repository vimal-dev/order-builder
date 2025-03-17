from marshmallow import Schema, fields


class FilterSchema(Schema):
    column = fields.String(required=True)
    operator = fields.String(required=True)
    query_1 = fields.Raw(allow_none=True)  # Accepts any type (string, number, etc.)
    query_2 = fields.Raw(allow_none=True) 


class ExportOptionsSchema(Schema):
    filters = fields.List(fields.Nested(FilterSchema), required=True)
    sorting = fields.List(fields.Dict,required=True)


class ExportOrdersSchema(Schema):
    export_type = fields.String(load_default="orders")
    export_options = fields.Nested(ExportOptionsSchema, required=True)