from flask import Blueprint

console = Blueprint('console', __name__)
from app.commands import welcome
from app.commands import order_received