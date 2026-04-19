"""Testes do módulo de validação."""

from src.etl.validator import DataValidator


def test_validator_identifica_valor_invalido():
    """Valida marcação de valor inválido quando <= 0."""
    errors = DataValidator().validate_row({"valor": 0})
    assert "valor_invalido" in errors
