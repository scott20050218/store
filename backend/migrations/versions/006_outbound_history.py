"""Add outbound_history table

Revision ID: 006
Revises: 005
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "outbound_history",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("item_type", sa.String(64), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("outbound_date", sa.Date(), nullable=False),
        sa.Column("create_time", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbound_history_user_id", "outbound_history", ["user_id"], unique=False)
    op.create_index("ix_outbound_history_item_type", "outbound_history", ["item_type"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_outbound_history_item_type", table_name="outbound_history")
    op.drop_index("ix_outbound_history_user_id", table_name="outbound_history")
    op.drop_table("outbound_history")
