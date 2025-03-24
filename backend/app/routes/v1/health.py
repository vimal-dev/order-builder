from flask import Blueprint, jsonify, request

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
    _export = request.args.get('_export')
    if _export:
        export_orders.delay(_export)
    return jsonify(response), response["code"]