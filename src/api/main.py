"""Aplicação FastAPI principal."""

try:
    from fastapi import FastAPI
except ImportError:  # pragma: no cover
    FastAPI = None

from src.api.routes.alertas import get_alerta, list_alertas
from src.api.routes.despesas import get_despesa, list_despesas
from src.api.routes.fornecedores import get_fornecedor, list_fornecedores
from src.api.routes.relatorios import gerar_relatorio

if FastAPI is not None:
    app = FastAPI(title="Análise de Despesas Públicas")

    @app.get("/health")
    def health() -> dict:
        """Retorna status de saúde da API."""
        return {"status": "ok"}

    @app.get("/despesas")
    def despesas() -> list[dict]:
        """Lista despesas."""
        return list_despesas()

    @app.get("/despesas/{despesa_id}")
    def despesa(despesa_id: int) -> dict:
        """Retorna detalhe de despesa."""
        return get_despesa(despesa_id)

    @app.get("/alertas")
    def alertas() -> list[dict]:
        """Lista alertas."""
        return list_alertas()

    @app.get("/alertas/{alerta_id}")
    def alerta(alerta_id: int) -> dict:
        """Retorna detalhe de alerta."""
        return get_alerta(alerta_id)

    @app.get("/fornecedores")
    def fornecedores() -> list[dict]:
        """Lista fornecedores."""
        return list_fornecedores()

    @app.get("/fornecedores/{cnpj}")
    def fornecedor(cnpj: str) -> dict:
        """Retorna perfil de fornecedor."""
        return get_fornecedor(cnpj)

    @app.post("/analise/iniciar")
    def iniciar_analise() -> dict:
        """Dispara análise manual."""
        return {"status": "analise_iniciada"}

    @app.get("/relatorios/gerar")
    def relatorios() -> dict:
        """Gera relatório."""
        return gerar_relatorio()

else:
    app = None
