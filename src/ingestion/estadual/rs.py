from ._estado_stub import EstadoStubCollector


class RioGrandeDoSulCollector(EstadoStubCollector):
    def __init__(self) -> None:
        super().__init__("RS", "https://transparencia.rs.gov.br/", "https://www.tce.rs.gov.br/")
