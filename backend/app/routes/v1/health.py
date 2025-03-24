from flask import Blueprint, current_app, jsonify, request

from app.mail import get_outlook_token, send_order_received
from app.tasks import export_orders


router = Blueprint("health", __name__)

@router.route('/health-check', methods=['GET'])
def check():
    # data = {
    #     "app_name": current_app.config.get("APP_NAME"),
    #     "customer_name": "veesysdevel@gmail.com",
    # }
    # try:
    #     access_token = get_outlook_token()
    #     send_order_received(access_token, "veesysdevel@gmail.com", data)
    #     # result.append(order.get("id"))
    # except Exception as e:
    #     current_app.logger.error(str(e))
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    _export = request.args.get('_export')
    if _export:
        export_orders.delay(_export)
    return jsonify(response), response["code"]