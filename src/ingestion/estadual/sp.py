from ._estado_stub import EstadoStubCollector


class SaoPauloCollector(EstadoStubCollector):
    def __init__(self) -> None:
        super().__init__("SP", "https://www.transparencia.sp.gov.br/", "https://www.tce.sp.gov.br/")
