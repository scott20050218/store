"""Add inbound_history table

Revision ID: 005
Revises: 004
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "inbound_history",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("inventory_record_id", sa.String(36), nullable=False),
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
    op.create_index("ix_inbound_history_user_id", "inbound_history", ["user_id"], unique=False)
    op.create_index("ix_inbound_history_inventory_record_id", "inbound_history", ["inventory_record_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_inbound_history_inventory_record_id", table_name="inbound_history")
    op.drop_index("ix_inbound_history_user_id", table_name="inbound_history")
    op.drop_table("inbound_history")
