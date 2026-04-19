"""Detecção de pagamentos duplicados."""

from src.detection.rules_engine import RulesEngine


class DuplicateDetector:
    """Detecta duplicidades exatas usando hash MD5."""

    def find(self, rows: list[dict]) -> list[dict]:
        """Retorna pares de duplicidades detectadas."""
        engine = RulesEngine()
        return [
            alert
            for alert in engine.evaluate(rows)
            if alert["tipo"] == "PAGAMENTO_DUPLICADO"
        ]
