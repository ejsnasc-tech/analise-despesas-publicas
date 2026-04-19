"""Schemas usados pela API."""

from dataclasses import dataclass


@dataclass
class HealthResponse:
    """Resposta do endpoint de health check."""

    status: str
