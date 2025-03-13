import magic
import typing
from marshmallow import fields, ValidationError
from werkzeug.datastructures.file_storage import FileStorage


def get_extension(name: str) -> str | None:
    extension = name.split('.')[-1]
    return extension.lower() if extension else None


def get_mime(stream):
    header = stream.read(2048)
    stream.seek(0)
    return magic.from_buffer(header, mime=True)


def is_validate_image(file: FileStorage | None):
    """Validate uploaded image file."""
    allowed_image_types = app.config["WHITELISTED_IMAGE_TYPES"]
    valid = True
    errors = []

    if not isinstance(file, FileStorage) or not file.filename:
        valid = False
        errors.append("Invalid image file.")
    else:
        mime_type = get_mime(file.stream)
        extension = get_extension(file.filename)
        
        if not extension or extension not in allowed_image_types:
            valid = False
            errors.append("Invalid image extension.")

        if file.content_type not in allowed_image_types.values():
            valid = False
            errors.append("Invalid image content-type.")

        if mime_type not in allowed_image_types.values() or mime_type != file.content_type:
            valid = False
            errors.append("Invalid image mime-type.")

    return valid, errors


class FileField(fields.Field):
    """Custom Marshmallow Field for File Validation"""

    #: Default error messages.
    default_error_messages = {
        "invalid": "Not a valid file.",
        "invalid_extension": "Invalid file extension.",
        "invalid_content": "Invalid file content type",
        'not_readable': "File is not readable.",
    }

    def _validate_missing(self, value: typing.Any) -> None:
        """Validate missing values. Raise a :exc:`ValidationError` if
        `value` should be considered missing.
        """
        if (value is None or (isinstance(value, FileStorage) and len(value.filename) == 0)) and self.required:
            raise self.make_error("required")
        if value is None and not self.allow_none:
            raise self.make_error("null")

    def _deserialize(self, value, attr, data, **kwargs) -> FileStorage | None:

        allowed_extensions = self.metadata["allowed_extensions"] if ("allowed_extensions" in self.metadata and type(self.metadata["allowed_extensions"]) == list) else []
        allowed_content_type = self.metadata["allowed_content_type"] if ("allowed_content_type" in self.metadata and type(self.metadata["allowed_content_type"]) == list) else []
        allowed_size = None

        if isinstance(value, FileStorage) is False or len(value.filename) == 0:
            raise self.make_error("not_readable")

        # mime_type = get_mime(value.stream)
        extension = get_extension(value.filename)
        if allowed_extensions and (not extension or extension not in allowed_extensions):
            raise self.make_error("invalid_extension")

        if allowed_content_type and (value.content_type not in allowed_content_type):
            raise self.make_error("invalid_content")

        # value.seek(0, os.SEEK_END)
        # file_length = image.tell()
        # image.seek(0)
        # max_size = 2 * 1024 * 1024  # 2 MB
        # if file_length > max_size:
        #     raise ValidationError(f'File size must be less than {max_size / (1024 * 1024):.2f} MB.')

        # if mime_type not in allowed_pdf_types.values() and mime_type != value.content_type:
        #     raise ValidationError("Invalid file MIME type.")
            

        return value