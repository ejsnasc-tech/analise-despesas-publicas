"""Análise de padrões temporais suspeitos."""

from datetime import datetime


class TemporalAnalysis:
    """Identifica concentração de gastos no fim do exercício."""

    def end_of_year_concentration(
        self, rows: list[dict], months: tuple[int, ...] = (11, 12)
    ) -> float:
        """Retorna proporção de registros em meses críticos."""
        if not rows:
            return 0.0
        critical = 0
        for row in rows:
            date_value = row.get("data_pagamento") or row.get("data_empenho")
            if not date_value:
                continue
            try:
                if datetime.fromisoformat(str(date_value)).month in months:
                    critical += 1
            except (ValueError, TypeError):
                continue
        return critical / len(rows)
