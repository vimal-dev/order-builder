from datetime import datetime, timedelta, timezone
import secrets
from flask import current_app
from sqlalchemy import DateTime, ForeignKey, event, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import db
from app.models.user import User


class RefreshToken(db.Model):
    __tablename__ = 'core_auth_refresh_tokens'
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(190), unique=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("core_users.id", ondelete="CASCADE"),
        nullable=False
    )
    user: Mapped[User] = relationship("User")
    created = mapped_column(DateTime, nullable=False)
    updated = mapped_column(DateTime, nullable=False)

    @property
    def is_expired(self) -> bool:
        seconds = int(current_app.config.get("REFRESH_JWT_EXPIRY_TIME"))
        created = self.created
        if seconds:
            if isinstance(created, datetime) and created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            return created + timedelta(seconds=seconds) < datetime.now(timezone.utc)
        return False


@event.listens_for(RefreshToken, "before_insert")
def on_update(mapper, connection, target):
    if not target.code:
        target.code = secrets.token_urlsafe(32)
    target.created = datetime.now(timezone.utc)
    target.updated = datetime.now(timezone.utc)


@event.listens_for(RefreshToken, "before_update")
def on_update(mapper, connection, target):
    target.updated = datetime.now(timezone.utc)
