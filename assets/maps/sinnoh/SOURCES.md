# 신오지방 타운맵

《포켓몬스터Pt 기라티나》의 닌텐도 DS 위 화면 타운맵을 앱에 포함했습니다. 원작의 4비트 지형 타일, 두 화면 레이어, 색상표를 합성하고 도시와 리그의 공중날기 표식을 원본 스프라이트로 배치했습니다. 만월섬·신월섬·숨겨진 샘의 길·갈라진 바닷길은 원작의 공개 상태 타일을 사용했습니다. 게임 이미지의 권리는 원작 권리자에게 있습니다. [타운맵 이미지 원본](https://github.com/pret/pokeplatinum/tree/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/graphics/town_map) · [레이어와 섬 표시 코드](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/src/applications/town_map/graphics.c) · [도시 표식](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/src/applications/town_map/fly_locations.c)

DS 위 화면 256×192픽셀 중 왼쪽 20픽셀, 오른쪽 20픽셀과 하단 24픽셀의 프레임 및 지명 표시줄을 잘라 지도 영역 216×168픽셀을 사용했습니다. 원작 격자 (x, z)의 커서 위치는 잘라낸 지도에서 (7x + 5, 7z − 34)입니다. 여러 칸에 걸친 도로는 도로 중심과 가까운 실제 칸을 선택했습니다. [커서 좌표 규칙](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/include/applications/town_map/defs.h) · [도로와 랜드마크 좌표](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/town_map/town_map_data.json)

떡잎마을, 201~230번도로와 수로, 포켓몬리그, 배틀존과 섬을 포함한 90곳을 표시합니다. 타운맵에 독립 표식이 없는 던전은 입구나 연결된 장소에 핀을 두었습니다. 깨어진 세계는 창기둥의 입구에, 무쇠·빙산·바위산의 유적은 강철섬·천관산 북쪽·228번도로에 표시됩니다. 지명이 겹치는 장소는 핀을 누른 뒤 상세 화면에서 선택할 수 있습니다. 한국어 장소명은 Pt 한국어판의 표기를 따릅니다. [원작 필드 입구와 지형 자료](https://github.com/pret/pokeplatinum/tree/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps) · [Pt 한국어 텍스트](https://github.com/abcboy101/poke-corpus/blob/main/corpus/Platinum/ko_msg.txt)

지역별 출현 포켓몬과 레벨은 [출현표 출처](ENCOUNTERS.md), 배지와 트레이너 파티는 [트레이너 자료](TRAINERS.md)에서 확인할 수 있습니다.
