"""Engenharia de features para modelos de anomalia."""

import math


class FeatureEngineering:
    """Cria vetores simples de características de despesas."""

    def transform(self, rows: list[dict]) -> list[dict]:
        """Produz features numéricas derivadas por registro."""
        transformed: list[dict] = []
        for row in rows:
            value = float(row.get("valor", 0) or 0)
            transformed.append(
                {
                    "valor": value,
                    "valor_log": 0 if value <= 0 else math.log(value),
                    "tem_dispensa": 1 if row.get("modalidade") == "DISPENSA" else 0,
                }
            )
        return transformed
