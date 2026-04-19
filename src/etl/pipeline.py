"""Orquestração do pipeline ETL."""

from src.etl.cleaner import DataCleaner
from src.etl.enricher import DataEnricher
from src.etl.normalizer import DataNormalizer
from src.etl.validator import DataValidator


class ETLPipeline:
    """Executa coleta limpa, normalização, validação e enriquecimento."""

    def __init__(self):
        """Inicializa componentes do pipeline."""
        self.cleaner = DataCleaner()
        self.normalizer = DataNormalizer()
        self.validator = DataValidator()
        self.enricher = DataEnricher()

    def run(self, dataframe):
        """Executa pipeline e retorna dataframe tratado e erros por linha."""
        cleaned = self.cleaner.clean(dataframe)
        normalized = self.normalizer.normalize(cleaned)
        validation_errors = [
            self.validator.validate_row(row)
            for row in normalized.to_dict(orient="records")
        ]
        enriched = self.enricher.enrich(normalized.to_dict(orient="records"))
        return enriched, validation_errors
