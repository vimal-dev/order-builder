from flask import Request


def parse_nested_form_data(req: Request):
    data = {}
    for key in req.form:
        value = req.form[key]
        if '.' in key:
            keys = key.split('.')
            d = data
            for k in keys[:-1]:
                if k not in d:
                    d[k] = {}
                d = d[k]
            d[keys[-1]] = value
        else:
            data[key] = value
    for key in req.files:
        file = req.files[key]
        if '.' in key:
            keys = key.split('.')
            d = data
            for k in keys[:-1]:
                if k not in d:
                    d[k] = {}
                d = d[k]
            d[keys[-1]] = file  # Or handle the file as needed
        else:
            data[key] = file  # Or handle the file as needed
    return data