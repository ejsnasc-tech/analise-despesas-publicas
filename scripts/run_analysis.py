"""Script de execução da análise de despesas."""

import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:  # pragma: no cover
    pd = None

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.detection.rules_engine import RulesEngine  # noqa: E402
from src.etl.pipeline import ETLPipeline  # noqa: E402
from src.scoring.risk_scorer import RiskScorer  # noqa: E402


def main() -> None:
    """Executa fluxo mínimo de análise com dados sintéticos."""
    if pd is None:
        print("pandas não está instalado no ambiente atual.")
        return

    sample = pd.DataFrame(
        [
            {
                "cnpj_fornecedor": "12.345.678/0001-90",
                "valor": "R$ 10.000,00",
                "data_pagamento": "2026-01-10",
                "objeto": "SERVICO DE LIMPEZA",
                "modalidade": "DISPENSA",
            }
        ]
    )
    pipeline = ETLPipeline()
    rows, _ = pipeline.run(sample)
    alerts = RulesEngine({"bid_exemption_limits": {"servicos": 8800}}).evaluate(rows)
    result = RiskScorer().score(alerts)
    print(result)


if __name__ == "__main__":
    main()
