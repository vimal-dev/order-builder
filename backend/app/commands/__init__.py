from flask import Blueprint

console = Blueprint('console', __name__)
from app.commands import welcome