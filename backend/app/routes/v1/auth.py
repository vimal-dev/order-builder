from flask import Blueprint, current_app, jsonify, request
from marshmallow import ValidationError
import pyotp

from app.database import db
from app.models.user import User
from app.schemas.auth import LoginSchema, LoginVerifySchema, RegisterSchema, RefreshTokenSchema
from app.services.auth import jwt_token
from app.mail import send_login_otp
from app.models.refresh_token import RefreshToken


router = Blueprint("auth", __name__, url_prefix="auth")


@router.route('/register', methods=['POST'])
def register():
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    data = request.get_json()
    try:
        data = RegisterSchema().load(data)
        user = db.session.query(User).filter_by(email=data.get("email")).first()
        if user is None:
            data.update({
                "is_active": True,
                "mfa_secret": pyotp.random_base32()
            })
            user = User(**data)
            db.session.add(user)
            db.session.commit()
            response["code"] = 200
            response["message"] = "Registered Successfully"
        else:
            response["code"] = 200
            response["success"] = False
            response["message"] = 'User already exists'
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"
    return jsonify(response), response["code"]

@router.route('/login', methods=['POST'])
def login():
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    data = request.get_json()
    try:
        debug = current_app.config.get("DEBUG")
        data = LoginSchema().load(data)
        user = db.session.query(User).filter_by(email=data.get("username")).first()
        if user and user.is_active:
            interval = int(current_app.config.get("OTP_INTERVAL"))
            current_app.logger.info(interval)
            totp = pyotp.TOTP(user.mfa_secret, interval=interval)
            otp = totp.now()
            if not debug:
                send_login_otp(user.email, {"otp": otp, "app_name": current_app.config.get("APP_NAME")})
            response["code"] = 200
            response["message"] = "Otp sent please check your email"
            if debug:
                response["data"] = {
                    "code": otp
                }
        else:
            response["code"] = 401
            response["success"] = False
            response["message"] = 'Login Failed'
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"
    return jsonify(response), response["code"]


@router.route('/login/verify', methods=['POST'])
def login_verify():
    response = {
        "code": 200,
        'message': 'Working!',
        "data": None,
        "errors": {},
    }
    data = request.get_json()
    try:
        data = LoginVerifySchema().load(data)
        user = db.session.query(User).filter_by(email=data.get("username"), is_active=True).first()
        if user and user.is_active:
            interval = int(current_app.config.get("OTP_INTERVAL"))
            totp = pyotp.TOTP(user.mfa_secret, interval=interval)
            code = data.get("code")
            current_app.logger.info(interval)
            if totp.verify(code):
                response["code"] = 200
                jwt_token_data = jwt_token(user.jwt_payload())
                refresh_token = RefreshToken(**{"user_id": user.id})
                db.session.add(refresh_token)
                db.session.commit()
                response["data"] = {
                    "access_token": jwt_token_data.get("token"),
                    "expires_in": jwt_token_data.get("expires_in") if "expires_in" in jwt_token_data else None,
                    "token_type": "Bearer",
                    "refresh_token": refresh_token.code,
                }
            else:
                response["code"] = 401
                response["success"] = False
                response["message"] = 'Invalid OTP'
            
        else:
            response["code"] = 401
            response["success"] = False
            response["message"] = 'Login Failed'
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"
    return jsonify(response), response["code"]


@router.route('/token/refresh', methods=['POST'])
def refresh_token():
    response = {
        "success": True,
        "code": 200,
        "message": 'Working',
        "data": None,
        "errors": {},
    }
    try:
        data = request.get_json()
        data = RefreshTokenSchema().load(data)
        token = data.get("token")
        # return 401 if token is not passed
        if not token:
            response["code"] = 401
            response["success"] = False
            response["message"] = "Token is invalid"
            return jsonify(response), response["code"]
        
        refresh_token = db.session.query(RefreshToken).filter_by(code=token).first()
        if refresh_token and refresh_token.is_expired is False:
            user = refresh_token.user
            if user and user.is_active:
                response["code"] = 200
                jwt_token_data = jwt_token(user.jwt_payload())
                response["data"] = {
                    "access_token": jwt_token_data.get("token"),
                    "expires_in": jwt_token_data.get("expires_in") if "expires_in" in jwt_token_data else None,
                    "token_type": "Bearer"
                }
        else:
            response["code"] = 401
            response["success"] = False
            response["message"] = "Refresh Token is invalid"
    except ValidationError as err:
        response["code"] = 422
        response["success"] = False
        response["errors"] = err.messages
        response["message"] = "Validation Error"
    return jsonify(response), response["code"]