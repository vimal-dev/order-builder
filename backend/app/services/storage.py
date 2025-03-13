from flask import current_app
import boto3


def get_spaces_client():
    return boto3.client(
        "s3",
        endpoint_url=current_app.config.get("AWS_ENDPOINT_URL"),
        aws_access_key_id=current_app.config.get("AWS_ACCESS_KEY"),
        aws_secret_access_key=current_app.config.get("AWS_SECRET_KEY"),
    )