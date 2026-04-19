"""Configurações centralizadas da aplicação."""

from functools import lru_cache

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover

    class BaseSettings:  # type: ignore
        """Fallback simples para ambientes sem pydantic-settings."""

        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)

    SettingsConfigDict = dict  # type: ignore


class Settings(BaseSettings):
    """Representa todas as configurações necessárias do sistema."""

    app_env: str = "development"
    log_level: str = "INFO"
    database_url: str = "sqlite:///./despesas.db"
    portal_transparencia_base_url: str = (
        "https://portaldatransparencia.gov.br/api-de-dados"
    )
    portal_transparencia_api_key: str = ""
    pncp_base_url: str = "https://pncp.gov.br/api/pncp/v1"
    cgu_base_url: str = "https://api.cgu.gov.br"
    tcu_base_url: str = "https://portal.tcu.gov.br"
    receitaws_base_url: str = "https://receitaws.com.br/v1"
    request_timeout_seconds: int = 30
    request_rate_limit_seconds: float = 0.2
    max_retries: int = 3

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Retorna instância única de configurações."""

    return Settings()
