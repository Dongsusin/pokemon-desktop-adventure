# 신오지방 야생 포켓몬

《포켓몬스터Pt 기라티나》의 필드 154곳에 설정된 풀숲·동굴 출현표 142개와 파도타기 출현표 54개를 게임의 63개 장소에 연결했습니다. 201~230번도로를 모두 포함하며 일반 포켓몬은 129종입니다. 다층 동굴과 남북으로 나뉜 도로는 한 장소에서 원작 층과 구간의 출현표를 함께 사용합니다. 귀혼동굴의 원작 맵 헤더에서 일반 조우를 끈 방 4곳은 집계에서 제외했습니다. [맵별 출현표와 헤더](https://github.com/pret/pokeplatinum/tree/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps) · [귀혼동굴 입구 헤더](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/turnback_cave_entrance/header.json)

슬롯의 가중치는 해당 지형의 조우율과 원작 슬롯 선택 확률을 곱한 값입니다. 파도타기 슬롯은 원작 최저 레벨부터 최고 레벨까지 균등하게 펼쳤습니다. 시간 한정 포켓몬은 하루 종일 만날 수 있도록 아침 6시간, 낮·저녁 10시간, 밤·심야 8시간의 비율로 풀을 합쳤습니다. 201번도로에서는 찌르꼬, 비버니, 귀뚤뚜가 Lv.2~3 범위에서 각자의 원작 레벨로 출현합니다. [조우 슬롯·시간대 교체·레벨 결정](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/src/overlay006/wild_encounters.c) · [원작 시각 구간](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/src/rtc.c) · [201번도로 출현표](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/route_201/encounters.json)

대습초원은 신오도감 기준의 일일 교체 후보 32칸을 원작 빈도로 합쳤습니다. 그 밖의 일반 풀에는 통상 산책과 파도타기 조우를 사용합니다. 낚시, 달콤한꿀, 포켓트레, 대량발생, 더블슬롯, 전국도감 획득 후 변하는 일일 풀 및 배회 이벤트는 이 출현표의 범위에서 제외했습니다. [대습초원의 날짜별 후보](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/encounters_great_marsh_lookout.json) · [원작 일일 선택](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/src/overlay006/great_marsh_daily_encounters.c)

## 전설·환상 포켓몬

원작 고정 전투를 각 장소의 희귀 조우로 옮겼습니다. 희귀 판정은 게임 공통 확률인 0.65%를 사용합니다. 창기둥의 두 종은 판정 성공 후 절반씩 선택됩니다. 원작의 배포 도구, 파티 조건과 이벤트 절차는 이 게임에서는 해당 장소로 이동하는 방식으로 대체했습니다.

| 장소 | 포켓몬 | 원작 이벤트 |
| --- | --- | --- |
| 깨어진세계 | 기라티나 Lv.47 | [깨어진세계](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/distortion_world_giratina_room/scripts.s) |
| 창기둥 | 디아루가 Lv.70, 펄기아 Lv.70 | [디아루가](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/spear_pillar_dialga/scripts.s) · [펄기아](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/spear_pillar_palkia/scripts.s) |
| 예지호, 입지호 | 유크시 Lv.50, 아그놈 Lv.50 | [예지호 동굴](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/acuity_cavern/scripts.s) · [입지호 동굴](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/valor_cavern/scripts.s) |
| 선단신전, 하드마운틴 | 레지기가스 Lv.1, 히드런 Lv.50 | [선단신전](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/snowpoint_temple_b5f/scripts.s) · [하드마운틴](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/stark_mountain_room_3/scripts.s) |
| 바위산유적, 빙산유적, 무쇠유적 | 레지락·레지아이스·레지스틸 Lv.30 | [바위산유적](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/rock_peak_ruins/scripts.s) · [빙산유적](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/iceberg_ruins/scripts.s) · [무쇠유적](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/iron_ruins/scripts.s) |
| 신월섬, 꽃의 낙원 | 다크라이 Lv.50, 쉐이미 Lv.30 | [신월섬](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/newmoon_island_forest/scripts.s) · [꽃의 낙원](https://github.com/pret/pokeplatinum/blob/62bdaacdca6c56a6a396f3e9911e2f922b79bba8/res/field/maps/flower_paradise/scripts.s) |
