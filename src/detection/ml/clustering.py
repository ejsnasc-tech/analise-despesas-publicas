"""Clustering de comportamentos de fornecedores."""

try:
    from sklearn.cluster import DBSCAN, KMeans
except ImportError:  # pragma: no cover
    KMeans = DBSCAN = None


class ClusteringAnalysis:
    """Executa KMeans e DBSCAN para agrupamento."""

    def kmeans(self, features: list[list[float]], n_clusters: int = 3) -> list[int]:
        """Retorna rótulos de cluster via KMeans."""
        if KMeans is None:
            raise RuntimeError("scikit-learn não está instalado.")
        return (
            KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
            .fit_predict(features)
            .tolist()
        )

    def dbscan(
        self, features: list[list[float]], eps: float = 0.5, min_samples: int = 5
    ) -> list[int]:
        """Retorna rótulos de cluster via DBSCAN."""
        if DBSCAN is None:
            raise RuntimeError("scikit-learn não está instalado.")
        return DBSCAN(eps=eps, min_samples=min_samples).fit_predict(features).tolist()
