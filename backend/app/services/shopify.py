import base64
import hashlib
import hmac
import json
from functools import wraps
from pathlib import Path
from typing import Dict

import shopify
from flask import current_app, request
from werkzeug.exceptions import BadRequest, Forbidden


def _hmac_is_valid(body, hmac_to_verify):
    api_secret = current_app.config.get("SHOPIFY_API_SECRET", None)
    digest = hmac.new(api_secret.encode('utf-8'), body, digestmod=hashlib.sha256).digest()
    computed_hmac = base64.b64encode(digest)
    return hmac.compare_digest(computed_hmac.decode('utf-8'), hmac_to_verify)


def shopify_webhook(f):
    """
  A decorator that checks and validates a Shopify Webhook request.
  """

    @wraps(f)
    def wrapper(*args, **kwargs):
        # Try to get required headers and decode the body of the request.
        
        webhook_topic = request.headers.get('X-Shopify-Topic', None)
        webhook_hmac = request.headers.get('X-Shopify-Hmac-Sha256', None)
        if webhook_topic is None or webhook_hmac is None:
            raise BadRequest()
        raw_data = request.get_data()
        webhook_data = json.loads(raw_data)

        # Verify the HMAC.
        if not _hmac_is_valid(raw_data, webhook_hmac):
            raise Forbidden()

        # Otherwise, set properties on the request object and return.
        return f(webhook_topic, webhook_data, *args, **kwargs)

    return wrapper


def with_shopify(f):
    """
     A decorator that adds a Shopify temp session.
     """

    @wraps(f)
    def wrapper(*args, **kwargs):
        shop_url = current_app.config.get("SHOPIFY_STORE")
        shop_url = f"{shop_url}.myshopify.com"
        api_version = current_app.config.get("SHOPIFY_API_VERSION")
        access_token = current_app.config.get("SHOPIFY_API_ACCESS_TOKEN")
        if shop_url and api_version and access_token:
            with shopify.Session.temp(shop_url, api_version, access_token):
                return f(*args, **kwargs)
        else:
            raise Exception("Shopify API Credentials Missing")

    return wrapper


@with_shopify
def get_customers(payload: Dict):
    gql_path = current_app.config.get("GRAPHQL_FOLDER")
    document = Path(f"{gql_path}/queries.graphql").read_text()

    # Specify the named operation to execute, and the parameters for the query
    raw_response = shopify.GraphQL().execute(
        query=document,
        variables=payload,
        operation_name="getCustomers",
    )
    parsed_response = json.loads(raw_response)
    return parsed_response["data"]["customers"], None


@with_shopify
def get_customer(id: str):
    gql_path = current_app.config.get("GRAPHQL_FOLDER")
    document = Path(f"{gql_path}/queries.graphql").read_text()

    # Specify the named operation to execute, and the parameters for the query
    raw_response = shopify.GraphQL().execute(
        query=document,
        variables={"id": id},
        operation_name="getCustomer",
    )
    parsed_response = json.loads(raw_response)
    return parsed_response["data"]["customer"], None


@with_shopify
def create_customer(payload: Dict):
    # Load the document with both queries
    gql_path = current_app.config.get("GRAPHQL_FOLDER")
    document = Path(f"{gql_path}/mutations.graphql").read_text()

    # Specify the named operation to execute, and the parameters for the query
    raw_response = shopify.GraphQL().execute(
        query=document,
        variables=payload,
        operation_name="customerCreate",
    )
    parsed_response = json.loads(raw_response)
    current_app.logger.info(parsed_response)
    return parsed_response["data"]["customerCreate"]["customer"], parsed_response["data"]["customerCreate"]["userErrors"] if "userErrors" in \
                                                                                               parsed_response[
                                                                                                   "data"]["customerCreate"] else None


@with_shopify
def update_customer(payload: Dict):
    # Load the document with both queries
    gql_path = current_app.config.get("GRAPHQL_FOLDER")
    document = Path(f"{gql_path}/mutations.graphql").read_text()

    # Specify the named operation to execute, and the parameters for the query
    raw_response = shopify.GraphQL().execute(
        query=document,
        variables=payload,
        operation_name="customerUpdate",
    )
    parsed_response = json.loads(raw_response)
    return parsed_response["data"]["customerUpdate"]["customer"], parsed_response["data"]["customerUpdate"][
        "userErrors"] if "userErrors" in \
                         parsed_response[
                             "data"]["customerUpdate"] else None
