"""Implementação da análise da Lei de Benford."""

from __future__ import annotations

from collections import Counter
from math import log10


class BenfordAnalysis:
    """Calcula distribuição observada e esperada do primeiro dígito."""

    @staticmethod
    def expected_distribution() -> dict[int, float]:
        """Retorna distribuição esperada da Lei de Benford."""
        return {digit: log10(1 + 1 / digit) for digit in range(1, 10)}

    def analyze(self, values: list[float]) -> dict:
        """Computa distribuição observada e desvio absoluto médio."""
        digits = [
            int(str(v).lstrip("0")[0])
            for v in values
            if v and float(v) > 0 and str(v).lstrip("0")[0].isdigit()
        ]
        total = len(digits) or 1
        observed_count = Counter(digits)
        observed = {
            digit: observed_count.get(digit, 0) / total for digit in range(1, 10)
        }
        expected = self.expected_distribution()
        mad = sum(abs(observed[d] - expected[d]) for d in range(1, 10)) / 9
        return {"observed": observed, "expected": expected, "mad": mad}
