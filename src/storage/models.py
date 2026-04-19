"""Modelos de dados do sistema."""

from dataclasses import dataclass


@dataclass
class Despesa:
    """Representa um registro de despesa pública."""

    id: int
    cnpj_fornecedor: str
    valor: float
    objeto: str


@dataclass
class Fornecedor:
    """Representa um fornecedor."""

    cnpj: str
    razao_social: str


@dataclass
class Contrato:
    """Representa um contrato administrativo."""

    id: int
    numero: str


@dataclass
class Alerta:
    """Representa alerta de irregularidade."""

    id: int
    tipo: str


@dataclass
class ScoreRisco:
    """Representa histórico de score de risco."""

    id: int
    score: float


@dataclass
class ColetaLog:
    """Representa log de execução de coleta."""

    id: int
    fonte: str
    status: str
