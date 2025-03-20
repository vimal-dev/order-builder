import os


class Config(object):
    DEBUG = False
    APP_NAME = "Loode Jewelry"
    API_PREFIX = "/api/v1"
    ADMIN_EMAIL = 'root@localhost'
    APP_URL = "http://localhost:3000"

    #APPLICATION_ROOT = "/"

    SECRET_KEY = '8f42a73054b1749f8f58848be5e6502c'

    JWT_PRIVATE_KEY = ''
    JWT_PUBLIC_KEY = ''
    JWT_EXPIRY_TIME = 604800  # defaults top 7 days in seconds
    REFRESH_JWT_EXPIRY_TIME = 1814400  # defaults top 21 days in seconds

    OTP_INTERVAL = 180   # OTP Valid for seconds

    MAIL_SERVER = 'sandbox.smtp.mailtrap.io'
    MAIL_PORT = 2525
    MAIL_USERNAME = 'demo'
    MAIL_PASSWORD = 'demo'
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_DEFAULT_SENDER = 'root@localhost'
    
    TIMEZONE = "Asia/Kolkata"

    WHITELISTED_IMAGE_TYPES = {
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png'
    }
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # bytes - approx 16 mb

    SHOPIFY_STORE = "demo"
    SHOPIFY_API_KEY = "api-keu"
    SHOPIFY_API_SECRET = "api-secret"
    SHOPIFY_API_ACCESS_TOKEN = "api-access-token"
    SHOPIFY_API_VERSION = "2024-01"
    SHOPIFY_API_SCOPES = "write_customers,write_companies"
    SHOPIFY_SUBSCRIBE_WEBHOOKS = "companies/create,companies/delete"
    SHOPIFY_CATALOGS = ''
    SHOPIFY_CURRENCY = 'USD'
    EXCHANGE_TOKENS = "demo"
    GRAPHQL_FOLDER = os.path.join(os.path.realpath(os.path.dirname(os.path.dirname(__file__))), "graphql")

    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(os.path.realpath(os.path.dirname(os.path.dirname(__file__))), "db", "database.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    STORAGE_PATH = os.path.join(os.path.realpath(os.path.dirname(os.path.dirname(__file__))), "storage")
    UPLOAD_FOLDER = os.path.join(STORAGE_PATH, 'uploads')

    AWS_REGION = "ap-south-1"
    AWS_ACCESS_KEY= "DO801E3JC24MMDJFYRHM"
    AWS_SECRET_KEY= "n7CPmT9B4wxR2fFOg4KTr3//2jIAba5XZETwzQUJNJo"
    AWS_ENDPOINT_URL= "https://abstrax.nyc3.digitaloceanspaces.com"
    AWS_S3_BUCKET = "abstrax"

    RECORDS_LIMIT = 25

    CELERY_BROKER_URL = 'redis://localhost:16379/0'
    CELERY_RESULT_BACKEND= 'redis://localhost:16379/0'

    GRAPHQL_FOLDER = os.path.join(os.path.realpath(os.path.dirname(__file__)), "graphql")

    MS_CLIENT_ID = "e0775e48-f977-4fe6-9236-fa86e5d811a9"
    MS_TENANT_ID = "906006d0-051a-4dd6-a9bb-38e4eec50b32"
    MS_CLIENT_SECRET = "mKe8Q~-yg0c6fUMkBRRos8b6bp4aLYre3aPx2dr8"
    MS_AUTHORITY = f"https://login.microsoftonline.com/{MS_TENANT_ID}"
    MS_SCOPES = ["https://graph.microsoft.com/.default"]
    MS_MAIL_USERNAME = "info@getloode.com"

    # @property
    # def SHOPIFY_API_SCOPES_LIST(self):
    #     return [str(x).strip() for x in self.SHOPIFY_API_SCOPES.split(',')] if self.SHOPIFY_API_SCOPES else []
    #
    # @property
    # def SHOPIFY_URL(self):
    #     return f"{self.SHOPIFY_STORE}.myshopify.com"
