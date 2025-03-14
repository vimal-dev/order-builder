from flask import Blueprint
api_v1 = Blueprint("v1", __name__, url_prefix="v1")

from .auth import router as auth_router
from .front import router as front_router
from .health import router as health_router
from .orders import router as order_router
from .shopify import router as shopify_router

api_v1.register_blueprint(auth_router)
api_v1.register_blueprint(front_router)
api_v1.register_blueprint(health_router)
api_v1.register_blueprint(order_router)
api_v1.register_blueprint(shopify_router)