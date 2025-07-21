from typing import Protocol, Any

class Conditional(Protocol):
    def get_decision(self, state: Any) -> str:
        ...
    