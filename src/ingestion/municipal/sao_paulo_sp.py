"""Coletor municipal da cidade de São Paulo."""

from src.ingestion.municipal.base_municipal import BaseMunicipalCollector


class MunicipioSaoPauloCollector(BaseMunicipalCollector):
    """Implementa integração básica com dados municipais de São Paulo."""

    municipio = "São Paulo"
