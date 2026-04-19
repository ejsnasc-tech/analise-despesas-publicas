"""Coletor estadual do Paraná."""

from src.ingestion.estadual.base_estadual import BaseEstadualCollector


class ParanaCollector(BaseEstadualCollector):
    """Implementa integração básica com portal estadual do PR."""

    uf = "PR"
