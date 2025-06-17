from datetime import datetime
from typing import Dict, List
from sqlalchemy import and_, or_, not_, column

def build_filters(filters: List[Dict], column_mapping: Dict[str, str]) -> List:
    conditions = []
    for f in filters:
        column_name = f.get("column")
        if column_name in column_mapping:
            column_type = column_mapping[column_name]
            query_1 = f.get("query_1")
            query_2 = f.get("query_2")
            f.update(filter_value_type_cast(query_1, query_2, column_type))
        column = f.get("column")
        query_1 = f.get("query_1")
        query_2 = f.get("query_2")
        operator = f.get("operator")
        condition = build_condition(column, operator, query_1, query_2)
        if condition is not None:
            conditions.append(condition)
    return conditions

def filter_value_type_cast(query_1, query_2, column_type) -> Dict:
    value = {
        "query_1": query_1,
        "query_2": query_2
    }
    match column_type:
        case "datetime":
            q1 = None
            q2 = None

            if query_1:
                if isinstance(query_1, datetime):
                    q1 = query_1
                else:
                    q1 = datetime.fromisoformat(query_1)

            if query_2:
                if isinstance(query_2, datetime):
                    q2 = query_2
                else:
                    q2 = datetime.fromisoformat(query_2)

            value = {
                "query_1": q1,
                "query_2": q2
            }
        case _:
            pass
    return value

def build_condition(column_name, operator, query_1, query_2):
    match operator:
        case "eq":
            return column(column_name) == query_1
        case "ne":
            return column(column_name) != query_1
        case "lt":
            return column(column_name) < query_1
        case "lte":
            return column(column_name) <= query_1
        case "gt":
            return column(column_name) > query_1
        case "gte":
            return column(column_name) >= query_1
        case "is_empty":
            return column(column_name).is_(None)
        case "is_not_empty":
            return column(column_name).is_not(None)
        case "contains":
            return column(column_name).ilike(f"%{query_1}%")
        case "starts_with":
            return column(column_name).ilike(f"{query_1}%")
        case "ends_with":
            return column(column_name).ilike(f"%{query_1}")
        case "includes":
            values = query_1 if type(query_1) is list else query_1.split(",") 
            return column(column_name).in_(values)
        case "not_includes":
            values = query_1 if type(query_1) is list else query_1.split(",") 
            return column(column_name).notin_(values)
        case "toggle":
            return column(column_name).is_(True) if query_1 == "on" else column.is_(False)
        case "between":
            return and_(column(column_name) >= query_1, column(column_name) <= query_2)
        case "not_between":
            return not_(and_(column(column_name) >= query_1, column(column_name) <= query_2))
        case _:
            return None
