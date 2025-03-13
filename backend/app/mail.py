from typing import Dict, List

from flask import render_template, current_app
from flask_mail import Message, Mail



def send_login_otp(email: str, otp: str):
    mail = Mail()
    mail.init_app(current_app)
    msg = Message("Your OTP for login",
                  recipients=[email])
    msg.html = render_template('emails/login_otp.html', app_name='Demo APP', otp=otp)
    mail.send(msg)



def order_received(email: List[str], data: Dict, files=None):
    if files is None:
        files = []
    mail = Mail()
    mail.init_app(current_app)
    msg = Message("Order customisation",
                  recipients=email)
    msg.html = render_template('emails/order-received.html', app_name='Demo APP', data=data)
    if files:
        for file in files:
            with open(file["path"], 'rb') as fp:
                msg.attach(file["name"], file["mime"], fp.read())
                fp.seek(0)
    mail.send(msg)


def send_customer_attachment_update(email: List[str], data: Dict, files=None):
    if files is None:
        files = []
    mail = Mail()
    mail.init_app(current_app)
    msg = Message("Your customizeed order is ready.",
                  recipients=email)
    msg.html = render_template('emails/customer-order-ready.html', app_name='Demo APP', data=data)
    if files:
        for file in files:
            with open(file["path"], 'rb') as fp:
                msg.attach(file["name"], file["mime"], fp.read())
                fp.seek(0)
    mail.send(msg)
