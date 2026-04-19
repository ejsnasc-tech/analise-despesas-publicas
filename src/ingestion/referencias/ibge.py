"""Coletor de dados geográficos do IBGE."""

from src.ingestion.base_collector import BaseCollector


class IBGECollector(BaseCollector):
    """Consulta informações geográficas e cadastrais do IBGE."""

    def municipios(self, **params):
        """Lista municípios."""
        return self.fetch("localidades/municipios", params=params)
