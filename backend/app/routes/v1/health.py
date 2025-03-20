from flask import Blueprint, current_app, jsonify

from app.tasks import export_orders
from app.mail import get_outlook_token, send_login_otp

router = Blueprint("health", __name__)

@router.route('/health-check', methods=['GET'])
def check():
    access_token = get_outlook_token()
    send_login_otp(access_token, "veesysdevel@gmail.com", {"otp": "121112", "app_name": current_app.config.get("APP_NAME")})
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    #export_orders.delay(3)
    return jsonify(response), response["code"]