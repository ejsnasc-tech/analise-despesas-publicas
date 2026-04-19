.PHONY: install test lint format run-api

install:
pip install -r requirements.txt -r requirements-dev.txt

test:
pytest -q

lint:
flake8 src tests
black --check src tests

format:
black src tests

run-api:
uvicorn src.api.main:app --reload
