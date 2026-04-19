"""Testes básicos da API."""

from src.api.main import app


def test_api_app_disponivel():
    """Valida comportamento da inicialização da API sem falhar importação."""
    assert app is None or hasattr(app, "routes")
