"""Initial schema: users, inventory_records, config

Revision ID: 001
Revises:
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(64), nullable=True),
        sa.Column("phone", sa.String(11), nullable=False),
        sa.Column("openid", sa.String(128), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="正常"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_openid", "users", ["openid"], unique=False)

    op.create_table(
        "inventory_records",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("item_type", sa.String(64), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=False),
        sa.Column("inbound_date", sa.Date(), nullable=False),
        sa.Column("production_date", sa.String(32), nullable=True),
        sa.Column("tag", sa.String(16), nullable=True),
        sa.Column("location", sa.String(64), nullable=True),
        sa.Column("photo", sa.String(512), nullable=True),
        sa.Column("create_time", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inventory_records_item_type", "inventory_records", ["item_type"], unique=False)

    op.create_table(
        "config",
        sa.Column("key", sa.String(64), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )


def downgrade() -> None:
    op.drop_table("config")
    op.drop_index("ix_inventory_records_item_type", table_name="inventory_records")
    op.drop_table("inventory_records")
    op.drop_index("ix_users_openid", table_name="users")
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_table("users")
