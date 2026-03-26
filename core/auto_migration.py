from abc import ABC, abstractmethod


class AutoMigration(ABC):
    def __init__(self) -> None:
        pass

    @abstractmethod
    def run(self, blueprint: dict) -> dict:
        pass

    @abstractmethod
    def targetVersion(self) -> str:
        pass

    @abstractmethod
    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        pass
