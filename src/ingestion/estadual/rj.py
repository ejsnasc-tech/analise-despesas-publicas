"""Coletor estadual do Rio de Janeiro."""

from src.ingestion.estadual.base_estadual import BaseEstadualCollector


class RioDeJaneiroCollector(BaseEstadualCollector):
    """Implementa integração básica com portal estadual do RJ."""

    uf = "RJ"
