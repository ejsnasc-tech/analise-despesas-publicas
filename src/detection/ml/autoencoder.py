"""Placeholder de autoencoder para detecção de anomalias."""


class AutoencoderDetector:
    """Implementa interface mínima para pipeline de autoencoder."""

    def fit(self, features):
        """Treina modelo de autoencoder (placeholder)."""
        return self

    def score(self, features):
        """Retorna score simples de reconstrução (placeholder)."""
        return [0.0 for _ in features]
