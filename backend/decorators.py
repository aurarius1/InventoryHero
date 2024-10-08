import json
import uuid
from functools import wraps

from flask import jsonify
from flask_jwt_extended import current_user
from backend.db.models.User import Household, HouseholdMembers, User
from backend.flask_config import socketio, app
from backend.sockets.sockets import general_socket_sid_mapping

def require_household_member(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        household_id = kwargs.get('household', None)
        if household_id is None:
            return jsonify(status="no_household_set"), 400
        household_member = HouseholdMembers.query.filter_by(member_id=current_user.id, household_id=household_id).first()
        if household_member is None:
            return jsonify(status="user_not_in_household"), 401
        return f(*args, **kwargs)

    return decorator


def emit_update():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            response = fn(*args, **kwargs)
            household = kwargs.get('household', None)

            # emit if success
            if 200 <= response[1] <= 299:
                socketio.emit("new-content", json.dumps({
                    "status": "ok",
                    "content": {
                        "user": current_user.username
                    }
                }), to=household, namespace='/household')

            return response

        return decorator

    return wrapper


def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            if current_user.is_admin:
                return fn(*args, **kwargs)
            return jsonify(status="admin_role_required"), 403

        return decorator

    return wrapper


def household_owner():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            household = kwargs.get('household', None)
            household = Household.query.filter_by(id=household, creator=current_user.id).first()
            if household is None:
                return jsonify(), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
