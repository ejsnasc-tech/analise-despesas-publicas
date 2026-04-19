"""Detecção de fracionamento de licitação."""

from collections import defaultdict
from datetime import datetime, timedelta


class BidSplittingDetector:
    """Agrupa despesas por fornecedor e objeto dentro de janela temporal."""

    def detect(
        self, rows: list[dict], limit: float = 8800, days_window: int = 30
    ) -> list[dict]:
        """Identifica grupos de despesas com soma acima do limite."""
        grouped = defaultdict(list)
        for row in rows:
            grouped[(row.get("cnpj_fornecedor"), row.get("objeto"))].append(row)

        alerts: list[dict] = []
        for key, entries in grouped.items():
            ordered = sorted(entries, key=lambda item: item.get("data_empenho") or "")
            for index, start in enumerate(ordered):
                if not start.get("data_empenho"):
                    continue
                start_date = datetime.fromisoformat(str(start["data_empenho"]))
                end_date = start_date + timedelta(days=days_window)
                window = [
                    item
                    for item in ordered[index:]
                    if item.get("data_empenho")
                    and datetime.fromisoformat(str(item["data_empenho"])) <= end_date
                ]
                total = sum(float(item.get("valor", 0) or 0) for item in window)
                if total > limit and len(window) > 1:
                    alerts.append(
                        {
                            "tipo": "FRACIONAMENTO_LICITACAO",
                            "chave": key,
                            "total": total,
                            "itens": window,
                        }
                    )
                    break
        return alerts
