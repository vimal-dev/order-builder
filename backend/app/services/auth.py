from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any, Dict
from flask import current_app, jsonify, request
import jwt

from app.database import db
from app.models.user import User


def jwt_token(payload) -> Dict:
    key = current_app.config.get('JWT_PRIVATE_KEY')
    algo = "RS256"
    if key is None or len(key) == 0:
        key = current_app.config.get('SECRET_KEY')
        algo = "HS256"

    expiry_time = int(current_app.config.get('JWT_EXPIRY_TIME'))
    if expiry_time is not None and expiry_time > 0:
        payload["exp"] = datetime.now(tz=timezone.utc) + timedelta(seconds=expiry_time)

    response = {
        "token": jwt.encode(payload=payload, key=key, algorithm=algo)
    }
    if expiry_time is not None and expiry_time > 0:
        response["expires_in"] = expiry_time

    return response


def jwt_payload(token) -> Dict[str, Any]:
    key = current_app.config.get('JWT_PUBLIC_KEY')
    algo = "RS256"
    if key is None or len(key) == 0:
        key = current_app.config.get('SECRET_KEY')
        algo = "HS256"

    return jwt.decode(jwt=token, key=key, algorithms=algo)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        invalid_response = {
            "success": False,
            "code": 401,
            "message": 'Token is invalid!',
            "data": None,
            "errors": {},
        }

        bearer = request.headers.get('Authorization', None)
        # return 401 if token is not passed
        if not bearer:
            return jsonify(invalid_response), invalid_response["code"]
        token = bearer.split()[1]
        try:
            # decoding the payload to fetch the stored details
            data = jwt_payload(token)
            current_user = db.session.query(User).filter_by(id=data.get("sub")).first()
            if current_user is None:
                return jsonify(invalid_response), invalid_response["code"]
        except Exception as e:
            print(str(e))
            return jsonify(invalid_response), invalid_response["code"]

        return f(current_user, *args, **kwargs)

    return decorated