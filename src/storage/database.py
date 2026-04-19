"""Conexão de banco de dados com suporte SQLite/PostgreSQL."""

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
except ImportError:  # pragma: no cover
    create_engine = None
    sessionmaker = None


def create_session(database_url: str):
    """Cria sessão SQLAlchemy quando biblioteca estiver disponível."""
    if create_engine is None or sessionmaker is None:
        raise RuntimeError("sqlalchemy não está instalado.")
    engine = create_engine(database_url, pool_pre_ping=True)
    return sessionmaker(bind=engine)()
