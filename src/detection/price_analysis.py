"""Análise simples de superfaturamento com Z-score."""

from statistics import mean, pstdev


class PriceAnalysis:
    """Calcula possíveis outliers de preço com Z-score."""

    def detect_overpricing(
        self, prices: list[float], threshold: float = 3.0
    ) -> list[dict]:
        """Retorna preços que excedem o threshold de desvio padrão."""
        if not prices:
            return []
        avg = mean(prices)
        std = pstdev(prices)
        if std == 0:
            return []
        return [
            {"valor": value, "zscore": (value - avg) / std}
            for value in prices
            if ((value - avg) / std) > threshold
        ]
