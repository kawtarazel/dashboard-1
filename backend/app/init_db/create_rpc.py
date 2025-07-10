import psycopg2
from psycopg2 import sql
from ..core.config import settings

def create_rpc_functions():
    # Define your function DDLs for each KPI
    create_functions = [
        """
        CREATE OR REPLACE FUNCTION public.get_top_n_attack_types(n integer)
        RETURNS TABLE(attack_type text, count integer)
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY SELECT attack_type, COUNT(*) FROM logs GROUP BY attack_type ORDER BY COUNT(*) DESC LIMIT n;
        END;
        $$;
        """,
        """
        CREATE OR REPLACE FUNCTION public.get_average_cvss_score()
        RETURNS numeric
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN (SELECT AVG(cvss_base_score) FROM logs WHERE cvss_base_score IS NOT NULL);
        END;
        $$;
        """,
        """
        CREATE OR REPLACE FUNCTION public.get_top_n_vulnerabilities(n integer)
        RETURNS TABLE(vulnerability_name text, count integer)
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY SELECT vulnerability_name, COUNT(*) FROM logs GROUP BY vulnerability_name ORDER BY COUNT(*) DESC LIMIT n;
        END;
        $$;
        """,
        """
        CREATE OR REPLACE FUNCTION public.get_top_n_malware_type(n integer)
        RETURNS TABLE(vulnerability_name text, count integer)
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY SELECT malware_type, COUNT(*) FROM logs GROUP BY malware_type ORDER BY COUNT(*) DESC LIMIT n;
        END;
        $$;
        """,
        """
        CREATE OR REPLACE FUNCTION public.get_successful_quarantine()
        RETURNS nu
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY SELECT COUNT(*) FROM logs WHERE quarantine_status = 'successful' ;
        END;
        $$;
        """,
        """
        CREATE OR REPLACE FUNCTION public.get_total_incidents()
        RETURNS integer
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN (SELECT COUNT(*) FROM logs where severity = 'HIGH' OR severity = 'CRITICAL' or log_type = 'THREAT' or action = 'BLOCKED');
        END;
        $$;
        """,
        """
        CREATE OR REPLACE FUNCTION public.get_average_cvss_score_trends()
        RETURNS TABLE(date date, average_score numeric)
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY SELECT date_trunc('month', timestamp) AS date, AVG(cvss_base_score) AS average_score
            FROM logs
            WHERE cvss_base_score IS NOT NULL
            GROUP BY date_trunc('month', timestamp)
            ORDER BY date;
        END;
        $$;
        """,
        """
        CREATE OR REPLACE FUNCTION public.get_incident_trends()
        RETURNS TABLE(date date, incident_count integer)
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY SELECT date_trunc('month', timestamp) AS date, COUNT(*) AS incident_count
            FROM logs
            WHERE severity IN ('HIGH', 'CRITICAL') OR log_type = 'THREAT' OR action = 'BLOCKED'
            GROUP BY date_trunc('month', timestamp)
            ORDER BY date;
        END;
        $$;
        """,
        # Add more functions as needed for other KPIs
    ]

    # Connect to the database
    conn = psycopg2.connect(
        dbname=settings.DASHBOARD_POSTGRES_DB,
        user=settings.DASHBOARD_POSTGRES_USER,
        password=settings.DASHBOARD_POSTGRES_PASSWORD,
        host=settings.DASHBOARD_POSTGRES_HOST,
        port=settings.DASHBOARD_POSTGRES_PORT
    )
    conn.autocommit = True  # DDL must run outside a transaction block in some setups
    cur = conn.cursor()

    try:
        for create_fn in create_functions:
            cur.execute(create_fn)
            print("Function created successfully.")
    finally:
        cur.close()
        conn.close()