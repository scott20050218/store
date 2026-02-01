"""Add tag and location to outbound_history

Revision ID: 007
Revises: 006
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("outbound_history", sa.Column("tag", sa.String(16), nullable=True))
    op.add_column("outbound_history", sa.Column("location", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("outbound_history", "location")
    op.drop_column("outbound_history", "tag")
