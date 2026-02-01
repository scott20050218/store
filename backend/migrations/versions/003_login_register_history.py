"""Add login_history and register_history tables

Revision ID: 003
Revises: 002
Create Date: 2025-02-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "login_history",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("login_time", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_login_history_user_id", "login_history", ["user_id"], unique=False)

    op.create_table(
        "register_history",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("openid", sa.String(128), nullable=True),
        sa.Column("phone", sa.String(11), nullable=False),
        sa.Column("register_time", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_register_history_openid", "register_history", ["openid"], unique=False)
    op.create_index("ix_register_history_phone", "register_history", ["phone"], unique=False)
    op.create_index("ix_register_history_user_id", "register_history", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_register_history_user_id", table_name="register_history")
    op.drop_index("ix_register_history_phone", table_name="register_history")
    op.drop_index("ix_register_history_openid", table_name="register_history")
    op.drop_table("register_history")
    op.drop_index("ix_login_history_user_id", table_name="login_history")
    op.drop_table("login_history")
