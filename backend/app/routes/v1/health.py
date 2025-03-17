from flask import Blueprint, jsonify

from app.tasks import export_orders

router = Blueprint("health", __name__)

@router.route('/health-check', methods=['GET'])
def check():
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    export_orders.delay(1)
    return jsonify(response), response["code"]