from typing import Dict, List

from flask import render_template, current_app
from flask_mail import Message, Mail


def get_mailer():
    mail = Mail()
    mail.init_app(current_app)
    return mail



def send_login_otp(email: str, data: Dict):
    mail = get_mailer()
    mail.init_app(current_app)
    msg = Message("Your OTP for login",
                  recipients=[email])
    msg.html = render_template('emails/login_otp.html', **data)
    try:
        mail.send(msg)
    except Exception as e:
        current_app.logger.error(str(e))



def order_received(email: List[str], data: Dict, files=None):
    if files is None:
        files = []
    mail = get_mailer()
    msg = Message("Order update",
                  recipients=email)
    msg.html = render_template('emails/order-received.html', **data)
    if files:
        for file in files:
            with open(file["path"], 'rb') as fp:
                msg.attach(file["name"], file["mime"], fp.read())
                fp.seek(0)
    try:
        mail.send(msg)
    except Exception as e:
        current_app.logger.error(str(e))


def send_customer_order_update(email: List[str], data: Dict, files=None):
    if files is None:
        files = []
    mail = get_mailer()
    msg = Message("Design Approval",
                  recipients=email)
    msg.html = render_template('emails/customer-order-update.html', **data)
    if files:
        for file in files:
            with open(file["path"], 'rb') as fp:
                msg.attach(file["name"], file["mime"], fp.read())
                fp.seek(0)
    try:
        mail.send(msg)
    except Exception as e:
        current_app.logger.error(str(e))



def send_customer_order_revision(email: List[str], data: Dict, files=None):
    if files is None:
        files = []
    mail = get_mailer()
    msg = Message("Updated Design Approval",
                  recipients=email)
    msg.html = render_template('emails/customer-order-revision.html', **data)
    if files:
        for file in files:
            with open(file["path"], 'rb') as fp:
                msg.attach(file["name"], file["mime"], fp.read())
                fp.seek(0)
    try:
        mail.send(msg)
    except Exception as e:
        current_app.logger.error(str(e))
