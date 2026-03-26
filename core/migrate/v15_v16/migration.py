import json

from core.auto_migration import AutoMigration

"""
Migration from Blueprint v1.5.0 to v1.6.0
"""


class Migration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()

    def run(self, blueprint: dict) -> dict:
        print('現在開始 migrate 到 ', self.targetVersion())
        # Start the recursive search and update process
        blueprint["pages"] = self.find_component_and_update(blueprint["pages"], None)

        print(self.targetVersion(), ' migrate 完畢。')

        return blueprint

    def targetVersion(self) -> str:
        return "1.6.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        for component in subcomponents:
            # Check if the component has the target name
            if component.get('name') == "選股/單一策略":
                print(
                    f'找到子元件: {component["name"]}，其 primaryKey 是: {component["parameters"]["primaryKey"]}')
                comm_key_ref = input(
                    '請輸入該子元件的 `commKeyReferenceKey` 要設定成什麼？(若不設定，直接按 Enter): ')
                if comm_key_ref:
                    component['parameters']['commKeyReferenceKey'] = comm_key_ref
                    print('已新增 `commKeyReferenceKey`。')
                else:
                    print('未設定 `commKeyReferenceKey`。')

            # Recursively search in nested subcomponents
            if 'subComponents' in component:
                self.find_and_update_subcomponents(component['subComponents'])

        return subcomponents

    def migrate_version(self, tree, version_name):
        tree['version'] = version_name

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        return subcomponents
