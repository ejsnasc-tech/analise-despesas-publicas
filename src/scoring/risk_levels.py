"""Níveis de risco baseados no score composto."""


def classify_risk(score: float) -> str:
    """Classifica score em nível de risco."""
    if score < 25:
        return "BAIXO"
    if score < 50:
        return "MÉDIO"
    if score < 75:
        return "ALTO"
    return "CRÍTICO"
