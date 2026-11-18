# 호연지방 포켓내비 지도

`town-map.png`는 《포켓몬스터 에메랄드》 포켓내비 지도의 240×160픽셀 화면입니다. 원본 8×8픽셀 타일을 게임의 배경 타일 순서대로 놓고 포켓내비 팔레트를 적용했습니다. Pokémon과 원작 그래픽은 원작 권리자에게 귀속됩니다. [타일 이미지](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/graphics/pokenav/region_map/map.png) · [배치](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/graphics/pokenav/region_map/map.bin) · [색상](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/graphics/pokenav/region_map/map.pal)

핀은 지도 영역의 좌상단을 기준으로 가로 한 타일, 세로 두 타일을 더한 원작 커서 좌표에 맞췄습니다. 여러 칸에 걸친 도로는 해당 도로의 실제 지도 격자 칸 가운데 중앙과 가까운 칸을 사용했습니다. 주요 지점과 동굴이 겹치면 같은 지도 지점에서 장소를 선택할 수 있습니다. [지도 구현](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/src/region_map.c) · [지역 범위](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/src/data/region_map/region_map_sections.json) · [도로 격자](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/src/data/region_map/region_map_layout.h)

미로마을부터 그랜드시티까지의 도시와 마을, 101~134번도로와 수로, 섬과 동굴 등 84곳을 표시합니다. 그랜드시티 남쪽은 시가지와 챔피언로드 입구, 북쪽은 포켓몬리그입니다. 지역 연결은 원작 필드의 인접 지도, 동굴 입구와 항로를 반영했습니다. 130번수로의 환상섬은 섬 전용 출현표를 갖는 별도 장소입니다. [필드 및 이동 데이터](https://github.com/pret/pokeemerald/tree/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/maps) · [지역명](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/location_names.csv)

육지의동굴과 바다의동굴은 원작에서 각각 네 도로 중 하나에 나타납니다. 이 게임의 지도는 각각 114번도로와 125번수로에 대표 핀을 표시하고, 각 동굴의 상세 화면에서 다른 입구가 있는 도로도 연결합니다. [원작 날씨 이벤트](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/scripts/abnormal_weather.inc)

장소별 포켓몬의 종류, 레벨과 출현율은 에메랄드 데이터를 사용합니다. [출현표 출처](ENCOUNTERS.md)
