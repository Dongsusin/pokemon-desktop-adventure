# 관동지방 지도 이미지 출처

## 관동지방 일러스트

`illustrated-map.png`는 사용자가 첨부한 《포켓몬스터 하트골드·소울실버》 관동지방 일러스트의 787×600 픽셀 PNG입니다. 첨부 파일을 그대로 포함했습니다. [동일 이미지의 원본 정보](https://archives.bulbagarden.net/wiki/File:HGSS_Kanto.png)

장소 핀은 일러스트에 보이는 도시, 길, 항구, 섬과 기존 1세대 지도 연결 관계에 맞춰 배치했습니다. 일러스트에서 건물이 분리되어 보이지 않는 실내 장소는 대응하는 도시 핀에서 선택할 수 있습니다. 세대가 다른 장소와 좁은 도로의 핀은 지형과 도로 연결을 기준으로 배치한 근사 좌표입니다.

## 관동지방 타운맵 데이터

관동지방 타운맵과 51곳의 장소 이미지는 `pret/pokered`의 리비전 `ba9c0568f64ae602fadda577a08c66639f93082a`에 있는 《포켓몬스터 레드·블루》의 원본 타일 데이터에서 조립했습니다. 이미지와 포켓몬은 원작 권리자에게 귀속됩니다. [원본 리비전](https://github.com/pret/pokered/tree/ba9c0568f64ae602fadda577a08c66639f93082a)

`town-map.png`는 원작 타운맵의 8×8 픽셀 타일 16개를 RLE 배치 순서로 배열하고, 슈퍼 게임보이의 원작 타운맵 팔레트를 적용한 160×144 픽셀 이미지입니다. [원본 타일과 RLE](https://github.com/pret/pokered/tree/ba9c0568f64ae602fadda577a08c66639f93082a/gfx/town_map) · [원작 팔레트](https://github.com/pret/pokered/blob/ba9c0568f64ae602fadda577a08c66639f93082a/data/sgb/sgb_palettes.asm)

원작의 지도 장소 좌표에는 화면 왼쪽 2타일과 위쪽 1타일을 더했습니다. 타일 중심을 사용하는 앱에서 원작의 `(x, y)`는 이미지 픽셀 `(x × 8 + 20, y × 8 + 12)`에 해당합니다. [원작 장소 좌표](https://github.com/pret/pokered/blob/ba9c0568f64ae602fadda577a08c66639f93082a/data/maps/town_map_entries.asm) · [원작 지도 좌표 변환](https://github.com/pret/pokered/blob/ba9c0568f64ae602fadda577a08c66639f93082a/engine/items/town_map.asm)

## 장소 이미지

`areas/<장소 ID>.png`는 각 장소의 원작 블록 배치, 블록셋, 타일셋을 결합해 지형과 건물의 배치를 보여 주는 정지 이미지입니다. 도로 1–25번은 같은 번호의 원작 도로이며, 마을과 도시는 해당 장소의 외부 지형입니다. 원작 슈퍼 게임보이의 장소별 또는 환경별 팔레트를 사용했습니다. [원본 장소 블록 배치](https://github.com/pret/pokered/tree/ba9c0568f64ae602fadda577a08c66639f93082a/maps) · [원본 블록셋](https://github.com/pret/pokered/tree/ba9c0568f64ae602fadda577a08c66639f93082a/gfx/blocksets) · [원본 타일셋](https://github.com/pret/pokered/tree/ba9c0568f64ae602fadda577a08c66639f93082a/gfx/tilesets)

| 장소 ID | 원작 지도 |
| --- | --- |
| `viridian-forest` | `ViridianForest` |
| `mt-moon` | `MtMoon1F` |
| `rock-tunnel` | `RockTunnel1F` |
| `power-plant` | `PowerPlant` |
| `sea-cottage` | `BillsHouse` |
| `ss-anne` | `SSAnneBow` |
| `victory-road` | `VictoryRoad2F` |
| `pokemon-tower` | `PokemonTower3F` |
| `safari-zone` | `SafariZoneCenter` |
| `seafoam-islands` | `SeafoamIslandsB4F` |
| `pokemon-mansion` | `PokemonMansion1F` |
| `digletts-cave` | `DiglettsCave` |
| `rocket-hideout` | `RocketHideoutB1F` |
| `silph-co` | `SilphCo1F` |
| `cerulean-cave` | `CeruleanCaveB1F` |
