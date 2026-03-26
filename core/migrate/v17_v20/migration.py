from core.auto_migration import AutoMigration
from core.feature.rename import Rename

"""
Migration from Blueprint v1.7.0 to v2.0.0
"""


class Migration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()

    def run(self, blueprint: dict) -> dict:
        print('現在開始 migrate 到 ', self.targetVersion())
        rename = Rename(rename_schema="rename.csv")
        result = rename.run(bleuprint=blueprint)
        print(self.targetVersion(), ' migrate 完畢。')

        return result

    def targetVersion(self) -> str:
        return "2.0.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        return subcomponents
