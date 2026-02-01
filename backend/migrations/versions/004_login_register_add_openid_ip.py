"""Add openid and ip to login_history; add ip to register_history

Revision ID: 004
Revises: 003
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c"
        ),
        {"t": table, "c": column},
    )
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()
    if not _column_exists(conn, "login_history", "openid"):
        op.add_column("login_history", sa.Column("openid", sa.String(128), nullable=True))
        op.create_index("ix_login_history_openid", "login_history", ["openid"], unique=False)
    if not _column_exists(conn, "login_history", "ip"):
        op.add_column("login_history", sa.Column("ip", sa.String(45), nullable=True))
    if not _column_exists(conn, "register_history", "ip"):
        op.add_column("register_history", sa.Column("ip", sa.String(45), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "login_history", "openid"):
        op.drop_index("ix_login_history_openid", table_name="login_history")
        op.drop_column("login_history", "openid")
    if _column_exists(conn, "login_history", "ip"):
        op.drop_column("login_history", "ip")
    if _column_exists(conn, "register_history", "ip"):
        op.drop_column("register_history", "ip")
