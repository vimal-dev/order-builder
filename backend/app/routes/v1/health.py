from flask import Blueprint, jsonify

router = Blueprint("health", __name__)

@router.route('/health-check', methods=['GET'])
def check():
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    return jsonify(response), response["code"]