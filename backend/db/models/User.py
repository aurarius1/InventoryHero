import datetime
import uuid


from dataclasses import dataclass

from sqlalchemy.sql.functions import now
from sqlalchemy.sql import expression

from backend.database import db


@dataclass
class User(db.Model):
    id: int = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username: str = db.Column(db.String(80), unique=True, nullable=False)
    email: str = db.Column(db.String(120), unique=True, nullable=False)
    password: str = db.Column(db.String(1024), nullable=False)
    email_confirmed: bool = db.Column(db.Boolean, default=False, nullable=False)
    confirmation_code: uuid.UUID = db.Column(db.Uuid, unique=True, nullable=True)
    is_admin: bool = db.Column(db.Boolean, server_default=expression.false(), nullable=False)
    first_name: str = db.Column(db.String(80), nullable=False, server_default="")
    last_name: str = db.Column(db.String(80), nullable=False, server_default="")
    registration_date: datetime = db.Column(db.DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.UTC), nullable=False)

    def __repr__(self):
        return '<User %r>' % self.username


@dataclass
class Household(db.Model):
    __tablename__ = "household"
    id: int = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name: str = db.Column(db.String(65535), nullable=False)
    creator: int = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    members = db.relationship("HouseholdMembers", back_populates="household", cascade="all, delete-orphan")
    creation_date: datetime = db.Column(db.DateTime, default=datetime.datetime.now(datetime.UTC))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
        }

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "creator": self.creator,
            "members": [member.serialize() for member in self.members]
        }


class HouseholdMembers(db.Model):
    __tablename__ = "household_members"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    household_id: int = db.Column(db.Integer, db.ForeignKey("household.id"), nullable=False)
    member_id: int = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    invite: uuid.UUID = db.Column(db.Uuid, nullable=True)
    joined: bool = db.Column(db.Boolean, nullable=False, default=False)

    household = db.relationship("Household", back_populates="members")

    def serialize(self):
        return {
            "id": self.id,
            "member": self.member_id,
        }
