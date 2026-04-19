"""Classe base para coletores municipais."""

from src.ingestion.base_collector import BaseCollector


class BaseMunicipalCollector(BaseCollector):
    """Especialização de coletor para portais municipais."""

    municipio: str = ""

    def despesas(self, **params):
        """Consulta despesas municipais."""
        return self.fetch("despesas", params=params)
