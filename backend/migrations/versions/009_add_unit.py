"""Add unit to inventory_records and inbound_history

Revision ID: 009
Revises: 008
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "inventory_records",
        sa.Column("unit", sa.String(32), nullable=True),
    )
    op.add_column(
        "inbound_history",
        sa.Column("unit", sa.String(32), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("inventory_records", "unit")
    op.drop_column("inbound_history", "unit")
