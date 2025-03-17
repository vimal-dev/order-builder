import json

from celery import Celery, Task as CeleryTask
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge

from app import config
from app.database import db
# from app.celery import celery


# def init_celery(app: Flask) -> None:
#     """Bind Celery instance to Flask app."""
#     celery.conf.update(app.config)

#     class ContextTask(celery.Task):
#         """Ensure Celery tasks run inside Flask app context."""
#         def __call__(self, *args, **kwargs):
#             with app.app_context():
#                 return super().__call__(*args, **kwargs)

#     celery.Task = ContextTask

def create_app() -> Flask:
    # create and configure the app
    app = Flask(__name__)

    from flask.cli import load_dotenv
    load_dotenv('.env')

    app.config.from_object(config.Config)
    app.config.from_prefixed_env()

    api_prefix = app.config.get("API_PREFIX")

    # configure CORS
    CORS(app, supports_credentials=True, resources={rf"{api_prefix}/*": {"origins": "*"}})

    # initialize the app with the extension
    db.init_app(app)
    migrate = Migrate(app, db)

    from app.routes import router
    app.register_blueprint(router, url_prefix=api_prefix)

    from app.commands import console
    app.register_blueprint(console)

    @app.errorhandler(HTTPException)
    @app.errorhandler(RequestEntityTooLarge)
    def handle_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        # start with the correct headers and status code from the error
        response = e.get_response()
        # replace the body with JSON
        response.data = json.dumps({
            "success": True,
            "code": e.code,
            "message": e.name,
            "data": None,
            "errors": {
                "description": e.description
            },
        })
        response.content_type = "application/json"
        return response

    return app
