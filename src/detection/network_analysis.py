"""Análise de redes de relacionamento entre entidades."""

try:
    import networkx as nx
except ImportError:  # pragma: no cover
    nx = None


class NetworkAnalysis:
    """Monta grafo de relacionamento para análise de centralidade."""

    def build_graph(self, rows: list[dict]):
        """Cria grafo de relações órgão-fornecedor."""
        if nx is None:
            raise RuntimeError("networkx não está instalado.")
        graph = nx.Graph()
        for row in rows:
            supplier = f"fornecedor:{row.get('cnpj_fornecedor', '')}"
            agency = f"orgao:{row.get('orgao', '')}"
            graph.add_edge(supplier, agency, valor=float(row.get("valor", 0) or 0))
        return graph

    def degree_centrality(self, graph):
        """Retorna centralidade de grau dos nós."""
        if nx is None:
            raise RuntimeError("networkx não está instalado.")
        return nx.degree_centrality(graph)
