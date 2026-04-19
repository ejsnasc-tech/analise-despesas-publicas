"""Coletor estadual de São Paulo."""

from src.ingestion.estadual.base_estadual import BaseEstadualCollector


class SaoPauloCollector(BaseEstadualCollector):
    """Implementa integração básica com portal estadual de SP."""

    uf = "SP"
