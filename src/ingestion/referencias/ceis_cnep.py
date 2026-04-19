"""Coletor de listas de sanções CEIS/CNEP."""

from src.ingestion.base_collector import BaseCollector


class CEISCNEPCollector(BaseCollector):
    """Realiza download de fontes de sanções públicas."""

    def ceis(self, **params):
        """Baixa lista CEIS."""
        return self.fetch("ceis", params=params)

    def cnep(self, **params):
        """Baixa lista CNEP."""
        return self.fetch("cnep", params=params)
