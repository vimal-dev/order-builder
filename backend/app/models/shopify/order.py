from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Text, event, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import db

@dataclass
class Order(db.Model):
    __tablename__ = 'core_orders'

    STATUS_PROCESSING = "Processing"
    STATUS_WAITING_FOR_APPROVAL = "Waiting For Approval"
    STATUS_DESIGN_APPROVED = "Design Approved"
    STATUS_REVISION_REQUESTED = "Revision Requested"
    STATUS_READY_FOR_PRODUCTION = "Ready For Production"
    STATUS_REJECTED = "Rejected"

    id: Mapped[str] = mapped_column(String(190), primary_key=True)
    order_number: Mapped[str] = mapped_column(String(190))
    customer_name: Mapped[str] = mapped_column(String(190), nullable=True, default=None)
    customer_email: Mapped[str] = mapped_column(String(190))
    order_items: Mapped[List["OrderItem"]] = relationship(back_populates="order")
    mail_sent = mapped_column(Boolean, nullable=True, default=True)
    status: Mapped[str] = mapped_column(String(190), nullable=True, default=None)
    created = mapped_column(DateTime, nullable=False)
    updated = mapped_column(DateTime, nullable=False)


class OrderItem(db.Model):
    __tablename__ = 'core_order_items'

    STATUS_PROCESSING = "Processing"
    STATUS_WAITING_FOR_APPROVAL = "Waiting For Approval"
    STATUS_DESIGN_APPROVED = "Design Approved"
    STATUS_REVISION_REQUESTED = "Revision Requested"
    STATUS_READY_FOR_PRODUCTION = "Ready For Production"
    STATUS_REJECTED = "Rejected"


    id: Mapped[str] = mapped_column(String(190), primary_key=True)
    order_id: Mapped[str] = mapped_column(
        ForeignKey("core_orders.id", ondelete="CASCADE"),
        nullable=False
    )
    order: Mapped[Order] = relationship("Order", back_populates="order_items")
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    custom_design: Mapped[str] = mapped_column(String(190), nullable=True ,default=None)
    product_name: Mapped[str] = mapped_column(String(255), nullable=True, default=None)
    title: Mapped[str] = mapped_column(String(255), nullable=True, default=None)
    sku: Mapped[str] = mapped_column(String(190), nullable=True, default=None)
    status: Mapped[str] = mapped_column(String(190), nullable=True, default=None)
    pdf_file: Mapped[str] = mapped_column(String(255), nullable=True, default=None)
    gift_image: Mapped[str] = mapped_column(String(255), nullable=True, default=None)
    # JSON field for storing flexible structured data
    properties: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default=[])
    others: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True, default={})
    attachments: Mapped[List["Attachment"]] = relationship(back_populates="order_item")
    created = mapped_column(DateTime, nullable=False)
    updated = mapped_column(DateTime, nullable=False)


class Attachment(db.Model):
    __tablename__ = 'core_order_item_attachments'

    STATUS_WAITING_FOR_APPROVAL = "Waiting For Approval"
    STATUS_DESIGN_APPROVED = "Design Approved"
    STATUS_REVISION_REQUESTED = "Revision Requested"
    STATUS_READY_FOR_PRODUCTION = "Ready For Production"
    STATUS_REJECTED = "Rejected"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_item_id: Mapped[str] = mapped_column(
        ForeignKey("core_order_items.id", ondelete="CASCADE"),
        nullable=False
    )
    order_item: Mapped[OrderItem] = relationship("OrderItem", back_populates="attachments")
    name: Mapped[str] = mapped_column(String(190))
    file: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(190), nullable=True, default=None)
    comment: Mapped[str] = mapped_column(Text, nullable=True, default=None)
    created = mapped_column(DateTime, nullable=False)
    updated = mapped_column(DateTime, nullable=False)

    @staticmethod
    def get_statuses():
        return [Attachment.STATUS_WAITING_FOR_APPROVAL, Attachment.STATUS_DESIGN_APPROVED, Attachment.STATUS_REVISION_REQUESTED, Attachment.STATUS_READY_FOR_PRODUCTION, Attachment.STATUS_REJECTED]


@event.listens_for(Order, "before_insert")
@event.listens_for(OrderItem, "before_insert")
@event.listens_for(Attachment, "before_insert")
def on_update(mapper, connection, target):
    target.created = datetime.now(timezone.utc)
    target.updated = datetime.now(timezone.utc)


@event.listens_for(Order, "before_update")
@event.listens_for(OrderItem, "before_update")
@event.listens_for(Attachment, "before_update")
def on_update(mapper, connection, target):
    target.updated = datetime.now(timezone.utc)
