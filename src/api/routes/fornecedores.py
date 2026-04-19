"""Rotas de fornecedores."""


def list_fornecedores() -> list[dict]:
    """Retorna lista vazia de fornecedores em modo inicial."""
    return []


def get_fornecedor(cnpj: str) -> dict:
    """Retorna perfil simplificado de fornecedor."""
    return {"cnpj": cnpj}
