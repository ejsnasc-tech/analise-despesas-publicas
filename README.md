# Sistema de Análise de Despesas Públicas

Plataforma em Python para coleta, processamento e detecção automatizada de erros, irregularidades e fraudes em despesas públicas das esferas Federal, Estadual e Municipal.

## Arquitetura

- **Ingestão**: coletores de APIs e fontes públicas
- **ETL**: limpeza, normalização, validação e enriquecimento
- **Detecção**: regras determinísticas, estatística, grafos e ML
- **Scoring**: cálculo de risco composto
- **API**: FastAPI para consulta e execução de análises
- **Dashboard/Relatórios**: visualização e exportação

## Pré-requisitos

- Python 3.11+
- Docker e Docker Compose (opcional)

## Instalação

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Configuração

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Preencha as variáveis sensíveis (tokens, credenciais e URLs).

## Execução

### Coleta de dados

```bash
python scripts/run_collection.py
```

### Pipeline de análise

```bash
python scripts/run_analysis.py
```

### API

```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Dashboard

```bash
python -m src.reporting.dashboard
```

## Testes

```bash
pytest -q
```

## Regras de detecção

As regras configuráveis ficam em `config/rules.yaml` e as fontes em `config/sources.yaml`.

## Contribuição

1. Crie uma branch de feature
2. Implemente e teste
3. Abra PR com descrição objetiva

## Licença

MIT
