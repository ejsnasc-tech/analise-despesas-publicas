"""Funções utilitárias para visualização de dados."""


def kpi_summary(total_despesas: int, total_alertas: int) -> dict:
    """Monta resumo de KPIs para dashboard."""
    return {"total_despesas": total_despesas, "total_alertas": total_alertas}
