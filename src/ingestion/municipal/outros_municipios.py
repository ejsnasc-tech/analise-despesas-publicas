"""Coletor genérico para municípios."""

from src.ingestion.municipal.base_municipal import BaseMunicipalCollector


class OutrosMunicipiosCollector(BaseMunicipalCollector):
    """Implementa integração genérica para municípios não mapeados."""
