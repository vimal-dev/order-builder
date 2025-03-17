from flask import Blueprint, jsonify

# from app.tasks import example_task

router = Blueprint("health", __name__)

@router.route('/health-check', methods=['GET'])
def check():
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    # example_task.apply_async()
    return jsonify(response), response["code"]