from typing import Dict, List

from flask import json, render_template, current_app
from flask_mail import Message, Mail
import msal
import requests


def get_mailer():
    mail = Mail()
    mail.init_app(current_app)
    return mail



def send_login_otp(access_token, email: str, data: Dict):
    body = render_template('emails/login_otp.html', **data)
    try:
        send_email_via_graph_api(access_token, "Your single-use code", email, body)
    except Exception as e:
        current_app.logger.error(str(e))


def send_order_received(access_token, email, data: Dict):
    body = render_template('emails/order-received.html', **data)
    try:
        send_email_via_graph_api(access_token, "Order Update", email, body)
    except Exception as e:
        current_app.logger.error(str(e))


def send_customer_order_update(access_token, email, data: Dict):
    body = render_template('emails/customer-order-update.html', **data)
    try:
        send_email_via_graph_api(access_token, "Design Approval", email, body)
    except Exception as e:
        current_app.logger.error(str(e))


def send_customer_order_revision(access_token, email, data: Dict):
    body = render_template('emails/customer-order-revision.html', **data)
    try:
        send_email_via_graph_api(access_token, "Updated Design Approval", email, body)
    except Exception as e:
        current_app.logger.error(str(e))



# def order_received(email: List[str], data: Dict, files=None):
#     if files is None:
#         files = []
#     mail = get_mailer()
#     msg = Message("Order update",
#                   recipients=email)
#     msg.html = render_template('emails/order-received.html', **data)
#     if files:
#         for file in files:
#             with open(file["path"], 'rb') as fp:
#                 msg.attach(file["name"], file["mime"], fp.read())
#                 fp.seek(0)
#     try:
#         mail.send(msg)
#     except Exception as e:
#         current_app.logger.error(str(e))


def get_outlook_token():
    app = msal.ConfidentialClientApplication(
        client_id=current_app.config.get("MS_CLIENT_ID"),
        authority=current_app.config.get("MS_AUTHORITY"),
        client_credential=current_app.config.get("MS_CLIENT_SECRET"),
    )
    result = app.acquire_token_for_client(scopes=current_app.config.get("MS_SCOPES"))
    if "access_token" in result:
        return result['access_token']
    else:
        raise Exception("Failed to acquire token", result.get("error"), result.get("error_description"))
    

def send_email_via_graph_api(access_token, subject, recipient, body):
    MAIL_USERNAME = current_app.config.get("MS_MAIL_USERNAME")
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    email_data = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": body
            },
            "from": {
                "emailAddress": {
                    "address": MAIL_USERNAME
                }
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": recipient
                    }
                }
            ]
        }
    }
    user_endpoint = f'https://graph.microsoft.com/v1.0/users/{MAIL_USERNAME}/sendMail'
    response = requests.post(
        user_endpoint,
        headers=headers,
        data=json.dumps(email_data)
    )
    if response.status_code != 202:
        raise Exception(f"Error sending email: {response.status_code} - {response.text}")



