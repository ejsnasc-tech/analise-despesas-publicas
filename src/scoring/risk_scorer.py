"""Cálculo de score de risco composto."""

from src.scoring.risk_levels import classify_risk


class RiskScorer:
    """Consolida alertas em score de risco de 0 a 100."""

    def __init__(self, weights: dict | None = None):
        """Inicializa pesos por tipo de alerta."""
        self.weights = weights or {}

    def score(self, alerts: list[dict]) -> dict:
        """Calcula score final e justificativas."""
        total = 0.0
        reasons: list[str] = []
        for alert in alerts:
            alert_type = str(alert.get("tipo", "")).lower()
            weight = float(self.weights.get(alert_type, 10))
            total += weight
            reasons.append(f"{alert.get('tipo')}: +{weight}")

        final_score = min(100.0, total)
        return {
            "score": final_score,
            "nivel": classify_risk(final_score),
            "justificativas": reasons,
        }
