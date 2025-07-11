
from sqlalchemy.orm import Session
from app.auth import models as AuthModels
from app.dashboard import models as DashboardModels
from app.auth.database import SessionLocal as Auth_Session
from app.dashboard.database import SessionLocal as Dashboard_Session
from app.auth import security

def seed_data():
    """Seed initial authentication data"""
    auth_db: Session = Auth_Session()
    try:
        # Seed permissions
        if auth_db.query(AuthModels.Permission).count() == 0:
            permissions = [
                AuthModels.Permission(name='view_dashboard', description='Can view the dashboard'),
                AuthModels.Permission(name='edit_profile', description='Can edit own profile'),
                AuthModels.Permission(name='manage_users', description='Can manage (add/edit/delete) users'),
                AuthModels.Permission(name='assign_roles', description='Can assign roles to users'),
                AuthModels.Permission(name='view_reports', description='Can view reports'),
                AuthModels.Permission(name='export_data', description='Can export data'),
                AuthModels.Permission(name='manage_permissions', description='Can manage permissions'),
                AuthModels.Permission(name='upload_files', description='Can upload files')
            ]
            auth_db.add_all(permissions)
            auth_db.commit()
            print("Permissions seeded")

        # Seed roles
        if auth_db.query(AuthModels.Role).count() == 0:
            roles = [
                AuthModels.Role(name='Strategic', description='Strategic level access'),
                AuthModels.Role(name='Managerial', description='Managerial level access'),
                AuthModels.Role(name='Operational', description='Operational level access'),
                AuthModels.Role(name='Viewer', description='View-only access'),
            ]
            auth_db.add_all(roles)
            auth_db.commit()
            print("Roles seeded")

        # Seed role_permissions
        if auth_db.query(AuthModels.RolePermission).count() == 0:
            # Get role and permission IDs
            role_ids = {role.name: role.id for role in auth_db.query(AuthModels.Role).all()}
            perm_ids = {perm.name: perm.id for perm in auth_db.query(AuthModels.Permission).all()}
            
            role_permissions = [
                # Viewer permissions
                AuthModels.RolePermission(role_id=role_ids['Viewer'], permission_id=perm_ids['edit_profile']),
                AuthModels.RolePermission(role_id=role_ids['Viewer'], permission_id=perm_ids['view_dashboard']),
                
                # Operational permissions
                AuthModels.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['view_dashboard']),
                AuthModels.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['edit_profile']),
                AuthModels.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['view_reports']),
                AuthModels.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['upload_files']),
                
                # Managerial permissions
                AuthModels.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['view_dashboard']),
                AuthModels.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['edit_profile']),
                AuthModels.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['view_reports']),
                AuthModels.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['upload_files']),
                AuthModels.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['export_data']),
                
                # Strategic permissions
                AuthModels.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['view_dashboard']),
                AuthModels.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['edit_profile']),
                AuthModels.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['view_reports']),
                AuthModels.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['upload_files']),
                AuthModels.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['export_data']),
            ]
            auth_db.add_all(role_permissions)
            auth_db.commit()
            print("Role permissions seeded")

        # Create admin user
        import os
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        admin_exists = auth_db.query(AuthModels.User).filter(AuthModels.User.email == admin_email).first()
        if not admin_exists:
            # Get Strategic role (assuming it exists)
            strategic_role = auth_db.query(AuthModels.Role).filter(AuthModels.Role.name == 'Strategic').first()
            if strategic_role:
                admin = AuthModels.User(
                    email=admin_email,
                    username="admin",
                    hashed_password=security.get_password_hash(admin_password),
                    is_superuser=True,
                    is_active=True,
                    is_verified=True,
                    role_id=strategic_role.id
                )
                auth_db.add(admin)
                auth_db.commit()
                print(f"Admin user created with email: {admin_email}")
            else:
                print("Strategic role not found, admin user not created")

    except Exception as e:
        print(f"Error seeding data in auth db : {e}")
        auth_db.rollback()
    finally:
        auth_db.close()

    try :
        # seed default rpc functions
        from app.init_db.create_rpc import create_rpc_functions
        create_rpc_functions()
        print("RPC functions created")

        dashboard_db : Session = Dashboard_Session()

        # Seed default KPIs
        if dashboard_db.query(DashboardModels.KPI).count() == 0:
            kpis = [
                DashboardModels.KPI(
                    name='Top N Attack Types',
                    description='Identifies the most common types of attacks detected in the environment',
                    level='Operational',
                    type='Detection',
                    target='Top 5',
                    unit='Count',
                    frequency='Monthly',
                    formula='Count of attack types',
                    reporting_format='Bar Chart',
                    data_source='SIEM Logs, Threat Intelligence, Incident Reports, Malware Detection Logs',
                    category='Detect',
                    rpc_function='get_top_n_attack_types'
                ),
                DashboardModels.KPI(
                    name='Detection Rule Performance',
                    description='Measures the effectiveness of detection rules in identifying threats',
                    level='Operational',
                    type='Performance',
                    target='>90',
                    unit='Percentage',
                    frequency='Weekly',
                    formula='(True Positives / Total Alerts) * 100',
                    reporting_format='Line Chart',
                    data_source='SIEM Logs, Threat Intelligence, Incident Reports, Malware Detection Logs, Firewall logs',
                    category='Detect'
                ),
                DashboardModels.KPI(
                    name='Average CVSS Score',
                    description='Calculates the average CVSS score of vulnerabilities detected',
                    level='Operational',
                    type='Vulnerability',
                    target='<5',
                    unit='CVSS Score',
                    frequency='Monthly',
                    formula='Average CVSS Score of all vulnerabilities',
                    reporting_format='Number',
                    data_source='Vulnerability Scanner',
                    category='Identify',
                    rpc_function='get_average_cvss_score'
                ),
                DashboardModels.KPI(
                    name='Top N Vulnerabilities',
                    description='Identifies the most critical vulnerabilities in the environment',
                    level='Operational',
                    type='Vulnerability',
                    target='Top 10',
                    unit='Count',
                    frequency='Monthly',
                    formula='Count of vulnerabilities by severity',
                    reporting_format='Bar Chart',
                    data_source='Vulnerability Scanner',
                    category='Identify',
                    rpc_function='get_top_n_vulnerabilities'
                ),
                DashboardModels.KPI(
                    name='Top N Malware Types',
                    description='Identifies the most common types of malware detected in the environment',
                    level='Operational',
                    type='Malware',
                    target='Top 5',
                    unit='Count',
                    frequency='Monthly',
                    formula='Count of malware types',
                    reporting_format='Bar Chart',
                    data_source='Malware Detection Logs',
                    category='Detect',
                    rpc_function='get_top_n_malware_type'
                ),
                DashboardModels.KPI(
                    name='Successful Quarantine Actions',
                    description='Measures the number of successful quarantine actions taken against threats',
                    level='Operational',
                    type='Response',
                    target='100% success rate',
                    unit='Count',
                    frequency='Weekly',
                    formula='Count of successful quarantine actions',
                    reporting_format='Line Chart',
                    data_source='Incident Response Logs',
                    category='Respond',
                    rpc_function='get_successful_quarantine'
                ),
                DashboardModels.KPI(
                    name='Number of Incidents',
                    description='Counts the total number of security incidents reported',
                    level='Managerial',
                    type='Incident',
                    target='Less than 50 per month',
                    unit='Count',
                    frequency='Monthly',
                    formula='Count of incidents',
                    reporting_format='Line Chart',
                    data_source='incident Response logs, SIEM logs, Threat Intelligence, Malware Detection Logs, Firewall logs',
                    category='Respond',
                    rpc_function='get_total_incidents'
                ),
                DashboardModels.KPI(
                    name='SLA Remediation Rate',
                    description='Measures the percentage of incidents remediated within the defined SLA',
                    level='Managerial',
                    type='Performance',
                    target='95% SLA compliance',
                    unit='Percentage',
                    frequency='Monthly',
                    formula='(Count of incidents remediated within SLA / Total incidents) * 100',
                    reporting_format='Bar Chart',
                    data_source='Incident Response Logs',
                    category='Respond'
                ),
                DashboardModels.KPI(
                    name='Average CVSS Score Trend',
                    description='Tracks the trend of average CVSS scores over time',
                    level='Managerial',
                    type='Vulnerability',
                    target='Stable or decreasing trend',
                    unit='CVSS Score',
                    frequency='Monthly',
                    formula='Average CVSS Score over time',
                    reporting_format='Line Chart',
                    data_source='Vulnerability Scanner',
                    category='Identify',
                    rpc_function='get_average_cvss_score_trend' 
                ),
                DashboardModels.KPI(
                    name='Security Awareness Training Completion',
                    description='Percentage of employees who have completed security awareness training',
                    level='Managerial',
                    type='Training',
                    target='100% completion',
                    unit='Percentage',
                    frequency='Quarterly',
                    formula='(Count of employees trained / Total employees) * 100',
                    reporting_format='Pie Chart',
                    data_source='Training Records',
                    category='Protect'
                ),
                DashboardModels.KPI(
                    name='Incident Trend',
                    description='Tracks the trend of security incidents over time',
                    level='Strategic',
                    type='Incident',
                    target='Stable or decreasing trend',
                    unit='Count',
                    frequency='Monthly',
                    formula='Count of incidents over time',
                    reporting_format='Line Chart',
                    data_source='Incident Response Logs, SIEM logs, Threat Intelligence, Malware Detection Logs, Firewall logs',
                    category='Respond',
                    rpc_function='get_incident_trends'
                ),
                DashboardModels.KPI(
                    name='IT Budget Allocation to Cybersecurity',
                    description='Percentage of IT budget allocated to cybersecurity initiatives',
                    level='Strategic',
                    type='Financial',
                    target='At least 15% of IT budget',
                    unit='Percentage',
                    frequency='Annually',
                    formula='(Cybersecurity Budget / Total IT Budget) * 100',
                    reporting_format='Bar Chart',
                    data_source='Financial Reports',
                    category='Protect'
                ),
                DashboardModels.KPI(
                    name='Security Staff Training Trend',
                    description='Tracks the trend of security staff training over time',
                    level='Strategic',
                    type='Training',
                    target='100% trained staff',
                    unit='Percentage',
                    frequency='Quarterly',
                    formula='(Count of trained security staff / Total security staff) * 100',
                    reporting_format='Line Chart',
                    data_source='Training Records',
                    category='Protect'
                ),
            ]
            dashboard_db.add_all(kpis)
            dashboard_db.commit()
            print("KPIs seeded")

        # Seed default tools
        if dashboard_db.query(DashboardModels.Tool).count() == 0:
            tools = [
                DashboardModels.Tool(
                    name='F5 BIGIP',
                    description='Web Application Firewall by F5',
                    type='WAF',
                    category='Sécurité des infrastructures, applicatifs et continuité',
                    vendor='F5',
                ),
                DashboardModels.Tool(
                    name='Radware',
                    description='Web Application Firewall by Radware',
                    type='WAF',
                    category='Sécurité des infrastructures, applicatifs et continuité',
                    vendor='Radware',
                ),
                DashboardModels.Tool(
                    name='Fortinet',
                    description='Next-Generation Firewall by Fortinet',
                    type='Firewall',
                    category='Security Perimeter',
                    vendor='Fortinet',
                ),
                DashboardModels.Tool(
                    name='Sophos Firewall',
                    description='Next-Generation Firewall by Sophos',
                    type='Firewall',
                    category='Security Perimeter',
                    vendor='Sophos',
                ),
                DashboardModels.Tool(
                    name='Palo Alto',
                    description='Next-Generation Firewall by Palo Alto',
                    type='Firewall',
                    category='Security Perimeter',
                    vendor='Palo Alto',
                ),
                DashboardModels.Tool(
                    name='Cisco ASA',
                    description='Adaptive Security Appliance by Cisco',
                    type='Firewall',
                    category='Security Perimeter',
                    vendor='Cisco',
                ),
                DashboardModels.Tool(
                    name='Checkpoint',
                    description='Next-Generation Firewall by Checkpoint',
                    type='Firewall',
                    category='Security Perimeter',
                    vendor='Checkpoint',
                ),
                DashboardModels.Tool(
                    name='Sophos Antivirus',
                    description='Antivirus solution by Sophos',
                    type='Antivirus',
                    category='Security Perimeter',
                    vendor='Sophos',
                ),
                DashboardModels.Tool(
                    name='Symantec',
                    description='Antivirus solution by Symantec',
                    type='Antivirus',
                    category='Security Perimeter',
                    vendor='Symantec',
                ),
                DashboardModels.Tool(
                    name='Kaspersky',
                    description='Antivirus solution by Kaspersky',
                    type='Antivirus',
                    category='Security Perimeter',
                    vendor='Kaspersky',
                ),
                DashboardModels.Tool(
                    name='Nucleon',
                    description='Antivirus solution by Nucleon',
                    type='Antivirus',
                    category='Security Perimeter',
                    vendor='Nucleon',
                ),
                DashboardModels.Tool(
                    name='Cyberreason',
                    description='Antivirus solution by Cyberreason',
                    type='Antivirus',
                    category='Security Perimeter',
                    vendor='Cyberreason',
                ),
                DashboardModels.Tool(
                    name='Nessus',
                    description='Vulnerability Scanner by Tenable',
                    type='Vulnerability Scanner',
                    category='Monitoring de la sécurité et réponse aux incidents',
                    vendor='Tenable',
                ),
                DashboardModels.Tool(
                    name='Rapid7',
                    description='Vulnerability Scanner by Rapid7',
                    type='Vulnerability Scanner',
                    category='Monitoring de la sécurité et réponse aux incidents',
                    vendor='Rapid7',
                ),
                DashboardModels.Tool(
                    name='OpenVAS',
                    description='Open Source Vulnerability Scanner',
                    type='Vulnerability Scanner',
                    category='Monitoring de la sécurité et réponse aux incidents',
                    vendor='Greenbone',
                ),
                DashboardModels.Tool(
                    name='Acunetix Web Application Scanner',
                    description='Web Application Security Scanner by Acunetix',
                    type='Web Application Scanner',
                    category='Monitoring de la sécurité et réponse aux incidents',
                    vendor='Acunetix',
                ),
                DashboardModels.Tool(
                    name='OWASP ZAP',
                    description='Open Web Application Security Project Zed Attack Proxy',
                    type='Web Application Scanner',
                    category='Monitoring de la sécurité et réponse aux incidents',
                    vendor='OWASP',
                ),
                DashboardModels.Tool(
                    name='Ivanti',
                    description='Patch Management solution by Ivanti',
                    type='Patch Management',
                    category='Sécurité des infrastructures, applicatifs et continuité',
                    vendor='Ivanti',
                ),
            ]
            dashboard_db.add_all(tools)
            dashboard_db.commit()
            print("Tools seeded")

    except Exception as e:
        print(f"Error seeding data in dashboard db : {e}")
        dashboard_db.rollback()
    finally:
        dashboard_db.close()
