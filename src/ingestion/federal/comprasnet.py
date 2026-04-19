"""Módulo de integração simplificada com ComprasNet."""

from src.ingestion.base_collector import BaseCollector


class ComprasNetCollector(BaseCollector):
    """Disponibiliza consultas de licitações e itens do ComprasNet."""

    def licitacoes(self, **params):
        """Consulta licitações."""
        return self.fetch("licitacoes", params=params)
