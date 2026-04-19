from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseEstadual(ABC):
    """Contrato base para coletores estaduais."""

    estado: str = ""

    @abstractmethod
    def coletar_despesas_por_orgao(self) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    def coletar_contratos(self) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    def coletar_licitacoes(self) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    def coletar_convenios(self) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    def coletar_empenhos_liquidacoes_pagamentos(self) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    def coletar_dados_municipais_tce(self) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    def coletar_relatorios_auditoria(self) -> list[dict[str, Any]]:
        ...
