"""Coletor municipal da cidade do Rio de Janeiro."""

from src.ingestion.municipal.base_municipal import BaseMunicipalCollector


class MunicipioRioDeJaneiroCollector(BaseMunicipalCollector):
    """Implementa integração básica com dados municipais do Rio de Janeiro."""

    municipio = "Rio de Janeiro"
