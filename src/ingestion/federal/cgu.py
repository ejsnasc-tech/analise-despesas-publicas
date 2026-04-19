"""Módulo de integração com API da CGU."""

from src.ingestion.base_collector import BaseCollector


class CGUCollector(BaseCollector):
    """Disponibiliza consultas de transferências e convênios."""

    def transferencias(self, **params):
        """Consulta transferências."""
        return self.fetch("transferencias", params=params)

    def siconv(self, **params):
        """Consulta registros do SICONV."""
        return self.fetch("siconv", params=params)
