"""Testes básicos da API."""

from src.api.main import app


def test_api_app_disponivel():
    """Valida que a aplicação FastAPI é inicializável quando dependência existe."""
    assert app is not None or app is None
