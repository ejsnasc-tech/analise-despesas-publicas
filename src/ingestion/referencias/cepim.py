"""Coletor de entidades impedidas (CEPIM)."""

from src.ingestion.base_collector import BaseCollector


class CEPIMCollector(BaseCollector):
    """Coleta dados do CEPIM."""

    def listar_entidades(self, **params):
        """Baixa lista de entidades impedidas."""
        return self.fetch("cepim", params=params)
