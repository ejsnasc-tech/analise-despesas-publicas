"""Repositórios de acesso a dados."""


class InMemoryRepository:
    """Repositório simples em memória para desenvolvimento."""

    def __init__(self):
        """Inicializa armazenamento em memória."""
        self._items: list[dict] = []

    def add(self, item: dict) -> None:
        """Adiciona item ao repositório."""
        self._items.append(item)

    def list_all(self) -> list[dict]:
        """Lista todos os itens armazenados."""
        return list(self._items)
