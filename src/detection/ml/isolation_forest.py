"""Wrapper simples de Isolation Forest para anomalias."""

try:
    from sklearn.ensemble import IsolationForest
except ImportError:  # pragma: no cover
    IsolationForest = None


class IsolationForestDetector:
    """Treina e prediz anomalias com Isolation Forest."""

    def __init__(self, contamination: float = 0.05, random_state: int = 42):
        """Inicializa detector."""
        if IsolationForest is None:
            raise RuntimeError("scikit-learn não está instalado.")
        self.model = IsolationForest(
            contamination=contamination, random_state=random_state
        )

    def fit_predict(self, features: list[list[float]]) -> list[int]:
        """Treina modelo e retorna marcação de anomalias."""
        return self.model.fit_predict(features).tolist()
