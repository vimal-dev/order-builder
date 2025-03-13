from datetime import datetime, timezone

from sqlalchemy import String, BigInteger, DateTime, event
from sqlalchemy.orm import Mapped, mapped_column
from app.database import db


class Webhook(db.Model):
    __tablename__ = 'core_shopify_webhooks'
    id: Mapped[str] = mapped_column(String(190), primary_key=True)
    shopify_id: Mapped[int] = mapped_column(BigInteger())
    created = mapped_column(DateTime, nullable=False)
    updated = mapped_column(DateTime, nullable=False)


@event.listens_for(Webhook, "before_insert")
def on_update(mapper, connection, target):
    target.created = datetime.now(timezone.utc)
    target.updated = datetime.now(timezone.utc)


@event.listens_for(Webhook, "before_update")
def on_update(mapper, connection, target):
    target.updated = datetime.now(timezone.utc)
