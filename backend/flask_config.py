import os, logging
from flask_socketio import SocketIO
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from backend.database import db, migrate
from datetime import timedelta

from backend.exceptions.inventory_hero_exceptions import UnknownDatabaseType


def parse_db_parameters(db_type, db_host, db_port, db_name, db_user, db_password):
    logger = logging.getLogger('config')
    if db_type != "sqlite" and any(param is None for param in [db_host, db_port, db_name, db_user, db_password]):
        logger.warning(f"Invalid database parameters for type {db_type}. Using sqlite as a default.")
        db_type = "sqlite"

    if db_type == "sqlite":
        driver = "sqlite+pysqlite"
        file_path = ""
        if os.path.exists("/app/inventoryhero/data"):
            file_path = "//app/inventoryhero/data/inventoryhero.db"
        else:
            logger.warning("/home/app/inventoryhero/inventoryhero.db not found, using memory based sqlite instance.")
        db_uri = f"{driver}://{file_path}"
    elif db_type == "mysql":
        driver = "mysql+mysqldb"
        db_uri = f"{driver}://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    elif db_type == "postgresql":
        driver = "postgresql+psycopg2"
        db_uri = f"{driver}://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    else:
        raise UnknownDatabaseType()
    return db_uri


class Config(object):
    logger = logging.getLogger('config')
    DB_TYPE = os.getenv('INVENTORYHERO_DB_TYPE', "sqlite")
    DB_HOST = os.getenv('INVENTORYHERO_DB_HOST', None)
    DB_PORT = os.getenv('INVENTORYHERO_DB_PORT', None)
    DB_NAME = os.getenv('INVENTORYHERO_DB_NAME', None)
    DB_USER = os.getenv('INVENTORYHERO_DB_USER', None)
    DB_PASSWORD = os.getenv('INVENTORYHERO_DB_PASSWORD', None)

    SQLALCHEMY_DATABASE_URI = ""

    DB_URI = os.getenv("INVENTORYHERO_DB_URI", None)
    if DB_URI is None:
        SQLALCHEMY_DATABASE_URI = parse_db_parameters(DB_TYPE, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
    else:
        logger.warning("If you entered a sqlite uri you need to make sure the specified path is available")
        SQLALCHEMY_DATABASE_URI = (DB_URI.replace("sqlite", "sqlite+pysqlite")
                                   .replace("postgresql", "postgresql+psycopg2")
                                   .replace("mysql", "mysql+mysqldb"))

    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "SUPER_SECRET_KEY")

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "60")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "30")))

    SMTP = {
        "server": os.getenv("SMTP_SERVER", None),
        "port": os.getenv("SMTP_PORT", None),
        "username": os.getenv("SMTP_USERNAME", None),
        "password": os.getenv("SMTP_PASSWORD", None),
        "sender_email": os.getenv("SMTP_EMAIL_ADDRESS", "noreply@inventory-hero.local"),
        "in_use": False
    }

    SMTP["in_use"] = (SMTP["server"] is not None and SMTP["port"] is not None
                      and SMTP["password"] is not None and SMTP["username"] is not None)

    CONFIRMATION_NEEDED = os.getenv("CONFIRMATION_NEEDED", "False").lower() in ('true', '1', 't')

    if CONFIRMATION_NEEDED and not SMTP["in_use"]:
        raise Exception("ENTER SMTP CONFIG OR DISABLE CONFIRMATION")

    APP_URL = os.getenv("APP_URL", "http://localhost:3000")



class DebugConfig(Config):
    DEBUG = True
    TESTING = True


class ProdConfig(Config):
    DEBUG = False
    TESTING = False


def get_config():
    is_development = os.getenv("IS_DEVELOPMENT", "True").lower() in ('true', '1', 't')
    if is_development:
        return DebugConfig
    return ProdConfig


app = Flask(__name__)
app.config.from_object(get_config())
app.logger.error(app.config)
jwt = JWTManager(app)


socketio = SocketIO(app, cors_allowed_origins="*")
gunicorn_logger = logging.getLogger('gunicorn.error')
app.logger.handlers.extend(gunicorn_logger.handlers)
app.logger.setLevel(logging.INFO)
CORS(app, origins=["*"])
