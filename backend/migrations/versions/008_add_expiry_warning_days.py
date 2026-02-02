"""Add expiry_warning_days to inventory_records

Revision ID: 008
Revises: 007
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "inventory_records",
        sa.Column("expiry_warning_days", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("inventory_records", "expiry_warning_days")
