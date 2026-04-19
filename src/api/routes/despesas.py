"""Rotas de despesas."""


def list_despesas() -> list[dict]:
    """Retorna lista vazia de despesas em modo inicial."""
    return []


def get_despesa(despesa_id: int) -> dict:
    """Retorna detalhe simplificado de despesa."""
    return {"id": despesa_id}
