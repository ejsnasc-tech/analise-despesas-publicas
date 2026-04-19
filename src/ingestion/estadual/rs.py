"""Coletor estadual do Rio Grande do Sul."""

from src.ingestion.estadual.base_estadual import BaseEstadualCollector


class RioGrandeDoSulCollector(BaseEstadualCollector):
    """Implementa integração básica com portal estadual do RS."""

    uf = "RS"
