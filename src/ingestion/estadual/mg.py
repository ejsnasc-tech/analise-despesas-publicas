"""Coletor estadual de Minas Gerais."""

from src.ingestion.estadual.base_estadual import BaseEstadualCollector


class MinasGeraisCollector(BaseEstadualCollector):
    """Implementa integração básica com portal estadual de MG."""

    uf = "MG"
