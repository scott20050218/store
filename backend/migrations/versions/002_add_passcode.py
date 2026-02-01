"""Add passcode to users

Revision ID: 002
Revises: 001
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _passcode_column_exists(conn) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'passcode'"
        )
    )
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()
    if not _passcode_column_exists(conn):
        op.add_column("users", sa.Column("passcode", sa.String(64), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    if _passcode_column_exists(conn):
        op.drop_column("users", "passcode")
