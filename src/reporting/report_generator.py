"""Geração de relatórios em formatos diversos."""

from pathlib import Path


class ReportGenerator:
    """Gera relatórios executivos e detalhados."""

    def generate_text_report(self, rows: list[dict], output_path: str) -> Path:
        """Gera relatório textual simples para ambiente mínimo."""
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        lines = [
            "Relatório de Despesas",
            "====================",
            f"Total de registros: {len(rows)}",
        ]
        path.write_text("\n".join(lines), encoding="utf-8")
        return path
