"""Módulo de integração simplificada com dados do SIAFI."""

from src.ingestion.base_collector import BaseCollector


class SIAFICollector(BaseCollector):
    """Disponibiliza consultas de execução orçamentária."""

    def despesas(self, **params):
        """Consulta despesas registradas no SIAFI."""
        return self.fetch("despesas", params=params)
