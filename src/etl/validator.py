"""Validações de integridade para despesas."""

from __future__ import annotations

from datetime import date

try:
    from validate_docbr import CNPJ, CPF
except ImportError:  # pragma: no cover
    CNPJ = CPF = None


class DataValidator:
    """Valida documentos, datas e valores."""

    def __init__(self):
        """Inicializa validadores de documento quando disponíveis."""
        self.cnpj_validator = CNPJ() if CNPJ else None
        self.cpf_validator = CPF() if CPF else None

    def validate_row(self, row: dict) -> list[str]:
        """Valida uma linha e retorna lista de erros encontrados."""
        errors: list[str] = []
        value = row.get("valor", 0)
        if value is None or float(value) <= 0:
            errors.append("valor_invalido")

        payment_date = row.get("data_pagamento")
        if payment_date and hasattr(payment_date, "date"):
            payment_date = payment_date.date()
        if isinstance(payment_date, date) and payment_date > date.today():
            errors.append("data_futura")

        cnpj = str(row.get("cnpj_fornecedor", ""))
        if self.cnpj_validator and cnpj and not self.cnpj_validator.validate(cnpj):
            errors.append("cnpj_invalido")
        return errors
