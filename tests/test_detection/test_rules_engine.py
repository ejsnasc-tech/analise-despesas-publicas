"""Testes do motor de regras."""

from src.detection.rules_engine import RulesEngine


def test_rules_engine_detecta_pagamento_duplicado():
    """Valida detecção de duplicidade por campos-chave."""
    rows = [
        {
            "cnpj_fornecedor": "1",
            "valor": 100,
            "data_pagamento": "2026-01-01",
            "objeto": "A",
        },
        {
            "cnpj_fornecedor": "1",
            "valor": 100,
            "data_pagamento": "2026-01-01",
            "objeto": "A",
        },
    ]
    alerts = RulesEngine().evaluate(rows)
    assert any(alert["tipo"] == "PAGAMENTO_DUPLICADO" for alert in alerts)
