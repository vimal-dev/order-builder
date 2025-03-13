from dataclasses import dataclass
from datetime import datetime, timezone
from sqlalchemy import DateTime, event, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import db

@dataclass
class User(db.Model):
    __tablename__ = 'core_users'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(190))
    email: Mapped[str] = mapped_column(String(190), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    mfa_secret: Mapped[str] = mapped_column(String(190), unique=True)
    created = mapped_column(DateTime, nullable=False)
    updated = mapped_column(DateTime, nullable=False)

    def jwt_payload(self):
        return {"sub": str(self.id), "name": self.name}


@event.listens_for(User, "before_insert")
def on_update(mapper, connection, target):
    target.created = datetime.now(timezone.utc)
    target.updated = datetime.now(timezone.utc)


@event.listens_for(User, "before_update")
def on_update(mapper, connection, target):
    target.updated = datetime.now(timezone.utc)
