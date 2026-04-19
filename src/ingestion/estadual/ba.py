"""Coletor estadual da Bahia."""

from src.ingestion.estadual.base_estadual import BaseEstadualCollector


class BahiaCollector(BaseEstadualCollector):
    """Implementa integração básica com portal estadual da BA."""

    uf = "BA"
