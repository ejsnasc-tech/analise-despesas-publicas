"""Rotas de alertas."""


def list_alertas() -> list[dict]:
    """Retorna lista vazia de alertas em modo inicial."""
    return []


def get_alerta(alerta_id: int) -> dict:
    """Retorna detalhe simplificado de alerta."""
    return {"id": alerta_id}
