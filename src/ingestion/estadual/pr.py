from ._estado_stub import EstadoStubCollector


class ParanaCollector(EstadoStubCollector):
    def __init__(self) -> None:
        super().__init__("PR", "https://www.transparencia.pr.gov.br/", "https://www.tce.pr.gov.br/")
