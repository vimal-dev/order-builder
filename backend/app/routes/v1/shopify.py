from http import HTTPStatus
from flask import Blueprint, current_app, jsonify, url_for
import shopify

from app.database import db
from app.services.shopify import shopify_webhook, with_shopify
from app.models.shopify.webhook import Webhook as WebhookModel
from app.webhooks.orders_create import handle as orders_create
from app.services.auth import token_required
from app.models.user import User

router = Blueprint("shopify", __name__, url_prefix="shopify")

@router.route('/is-connected', methods=['GET'])
@with_shopify
@token_required
def is_connected(current_user: User):
    connected_shop = None
    shop = shopify.Shop.current()
    if shop:
        connected_shop = shop.name
    response = {
        "code": 200,
        'message': 'Working!',
        "data": {
            "shop_connected": connected_shop,
            "webhook_url": url_for("app.v1.shopify.webhook", _external=True, _scheme='https')
        },
        "errors": {},
    }
    return jsonify(response), response["code"]


@router.route("/subscribe", methods=['POST'])
@with_shopify
def subscribe():
    webhook_url = url_for("app.v1.shopify.webhook", _external=True, _scheme='https',)
    subscribe_webhooks = current_app.config.get("SHOPIFY_SUBSCRIBE_WEBHOOKS")
    response_data = {}
    errors = {}
    if subscribe_webhooks:
        subscribe_webhooks = [x.strip() for x in subscribe_webhooks.split(',')]

    for sw in subscribe_webhooks:
        webhook_obj = shopify.Webhook()
        webhook_obj.topic = sw
        webhook_obj.address = webhook_url
        webhook_obj.format = "json"
        saved = webhook_obj.save()
        if saved:
            raw_data = {
                "id": sw,
                "shopify_id": webhook_obj.id,
            }
            webhook_model = db.session.query(WebhookModel).filter_by(id=sw).first()
            if webhook_model:
                webhook_model.shopify_id = webhook_obj.id
            else:
                webhook_model = WebhookModel(**raw_data)
                db.session.add(webhook_model)
            db.session.commit()
            response_data[sw] = webhook_obj.id
        else:
            current_app.logger.info(webhook_obj.errors.errors)
        response_data[sw] = webhook_obj.id

    response = {
        "code": 200,
        'message': 'Working!',
        "data": response_data,
        "errors": errors,
    }

    return jsonify(response), response["code"]


@router.route("/webhook", methods=['POST'])
@shopify_webhook
def webhook(webhook_topic, webhook_data):
    response = {
        "code": HTTPStatus.ACCEPTED,
        'message': 'ACCEPTED',
        "data": None,
        "errors": {},
    }
    current_app.logger.info("Received webhook: {}".format(webhook_topic))
    match webhook_topic:
        case "orders/cancelled" | "orders/create" | "orders/delete" | "orders/updated" | "orders/edited":
            orders_create(webhook_data)
        case _:
            pass

    return jsonify(response), response["code"]