from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import JSON, DateTime, ForeignKey, Text, event, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import db
from app.models.user import User

@dataclass
class Export(db.Model):

    STATUS_QUEUED = "Queued"
    STATUS_PROCESSING = "Processing"
    STATUS_COMPLETED = "Completed"
    STATUS_FAILED = "Failed"

    __tablename__ = 'core_exports'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("core_users.id", ondelete="CASCADE"),
        nullable=False
    )
    user: Mapped[User] = relationship("User")
    export_type: Mapped[str] = mapped_column(String(190))
    export_options: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True, default={})
    file: Mapped[str] = mapped_column(String(255), nullable=True, default=None)
    status: Mapped[str] = mapped_column(String(190))
    message: Mapped[str] = mapped_column(Text, nullable=True, default=None)
    created = mapped_column(DateTime, nullable=False)
    updated = mapped_column(DateTime, nullable=False)

    def jwt_payload(self):
        return {"sub": str(self.id), "name": self.name}


@event.listens_for(Export, "before_insert")
def on_update(mapper, connection, target):
    target.created = datetime.now(timezone.utc)
    target.updated = datetime.now(timezone.utc)


@event.listens_for(Export, "before_update")
def on_update(mapper, connection, target):
    target.updated = datetime.now(timezone.utc)
