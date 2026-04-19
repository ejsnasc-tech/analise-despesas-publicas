"""Testes de detector de duplicatas."""

from src.detection.duplicate_detector import DuplicateDetector


def test_duplicate_detector_retorna_alertas_de_duplicidade():
    """Valida retorno de alertas de duplicidade."""
    rows = [
        {
            "cnpj_fornecedor": "1",
            "valor": 50,
            "data_pagamento": "2026-01-01",
            "objeto": "X",
        },
        {
            "cnpj_fornecedor": "1",
            "valor": 50,
            "data_pagamento": "2026-01-01",
            "objeto": "X",
        },
    ]
    alerts = DuplicateDetector().find(rows)
    assert len(alerts) == 1
