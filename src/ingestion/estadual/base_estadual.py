"""Classe base para coletores estaduais."""

from src.ingestion.base_collector import BaseCollector


class BaseEstadualCollector(BaseCollector):
    """Especialização de coletor para portais estaduais."""

    uf: str = ""

    def despesas(self, **params):
        """Consulta despesas estaduais."""
        return self.fetch("despesas", params=params)
