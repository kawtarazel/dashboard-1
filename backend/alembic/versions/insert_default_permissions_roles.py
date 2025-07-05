"""Insert default permissions, roles, and role_permissions

Revision ID: insert_default_permissions_roles
Revises: 0a346c300c79
Create Date: 2025-07-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, DateTime, func

# revision identifiers, used by Alembic.
revision = 'insert_default_permissions_roles'
down_revision = '0a346c300c79'
branch_labels = None
depends_on = None

def upgrade():
    # Insert permissions
    op.execute("""
    INSERT INTO permissions (name, description, created_at) VALUES
    ('view_dashboard', 'Can view the dashboard', CURRENT_TIMESTAMP),
    ('edit_profile', 'Can edit own profile', CURRENT_TIMESTAMP),
    ('manage_users', 'Can manage (add/edit/delete) users', CURRENT_TIMESTAMP),
    ('assign_roles', 'Can assign roles to users', CURRENT_TIMESTAMP),
    ('view_reports', 'Can view reports', CURRENT_TIMESTAMP),
    ('export_data', 'Can export data', CURRENT_TIMESTAMP),
    ('manage_permissions', 'Can manage permissions', CURRENT_TIMESTAMP);
    """)
    # Insert roles
    op.execute("""
    INSERT INTO roles(name) VALUES('Strategic'),('Managerial'),('Operational'),('Viewer');
    """)
    # Insert role_permissions for Viewer
    op.execute("""
    INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    (4, 1, CURRENT_TIMESTAMP);
    """)
    # Insert role_permissions for Operational
    op.execute("""
    INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    (3, 1, CURRENT_TIMESTAMP),
    (3, 2, CURRENT_TIMESTAMP),
    (3, 5, CURRENT_TIMESTAMP);
    """)
    # Insert role_permissions for Managerial
    op.execute("""
    INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    (2, 1, CURRENT_TIMESTAMP),
    (2, 2, CURRENT_TIMESTAMP),
    (2, 5, CURRENT_TIMESTAMP),
    (2, 6, CURRENT_TIMESTAMP);
    """)
    # Insert role_permissions for Strategic
    op.execute("""
    INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    (1, 1, CURRENT_TIMESTAMP),
    (1, 2, CURRENT_TIMESTAMP),
    (1, 5, CURRENT_TIMESTAMP),
    (1, 6, CURRENT_TIMESTAMP);
    """)

def downgrade():
    op.execute("DELETE FROM role_permissions;")
    op.execute("DELETE FROM roles;")
    op.execute("DELETE FROM permissions;")
