from flask import Blueprint
router = Blueprint("app", __name__)
from .v1 import api_v1


router.register_blueprint(api_v1)