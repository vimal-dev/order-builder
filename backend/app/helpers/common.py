
import base64
from typing import Dict
from flask import json


def encode_next_token(value: Dict) -> str:
    value = json.dumps(value)
    return base64.b64encode(value.encode("ascii")).decode("ascii")


def decode_next_token(value: str) -> Dict:
    value = base64.b64decode(value.encode("ascii")).decode("ascii")
    return json.loads(value)