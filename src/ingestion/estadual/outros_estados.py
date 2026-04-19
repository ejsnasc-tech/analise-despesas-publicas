"""Coletor genérico para demais estados."""

from src.ingestion.estadual.base_estadual import BaseEstadualCollector


class OutrosEstadosCollector(BaseEstadualCollector):
    """Implementa integração genérica para estados não mapeados."""
