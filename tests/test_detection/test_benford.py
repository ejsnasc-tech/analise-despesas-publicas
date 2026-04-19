"""Testes de análise de Benford."""

from src.detection.benford_law import BenfordAnalysis


def test_benford_retorna_distribuicoes():
    """Valida presença das chaves principais do resultado."""
    result = BenfordAnalysis().analyze([100, 120, 150, 200, 230])
    assert "observed" in result
    assert "expected" in result
    assert "mad" in result
