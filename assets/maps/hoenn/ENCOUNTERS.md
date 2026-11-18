# 호연지방의 야생 포켓몬

《포켓몬스터 에메랄드》 영문판의 풀숲, 동굴, 파도타기 데이터를 사용했습니다. 113개 세부 맵에 있는 139개 출현표를 65개 지도 장소에 연결했습니다. 일반 포켓몬은 116종입니다. [원작의 장소별 출현표와 슬롯 확률](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/src/data/wild_encounters.json)

원작의 각 슬롯에 지형별 조우율과 해당 슬롯의 선택 확률을 곱했습니다. 여러 층이나 지형을 한 장소에서 다룰 때는 이 가중치를 합칩니다. 슬롯의 최저·최고 레벨 사이에서는 각 레벨이 같은 확률로 나옵니다. 낚시와 바위깨기는 별도 조작으로 시작하는 원작 활동이어서 이 게임의 산책 출현표에서는 풀숲과 수상 조우를 사용합니다. [원작의 조우 및 레벨 결정 코드](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/src/wild_encounter.c)

130번수로의 물 위에서는 바다 포켓몬이, 그 수로의 환상섬 풀숲에서는 마자 Lv.5~50이 출현합니다. 공유 테이블에 들어 있는 미사용 루비·사파이어 층은 제외했고, 변화동굴에는 에메랄드 기본 테이블의 주뱃이 출현합니다. [130번수로 원작 맵 스크립트](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/maps/Route130/scripts.inc)

전설 포켓몬은 각 장소에서 게임의 공통 희귀 조우 판정을 사용합니다. 하늘기둥의 레쿠쟈, 육지의동굴의 그란돈, 바다의동굴의 가이오가는 Lv.70입니다. [하늘기둥](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/maps/SkyPillar_Top/scripts.inc) · [육지의동굴](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/maps/TerraCave_End/scripts.inc) · [바다의동굴](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/maps/MarineCave_End/scripts.inc)

사막유적의 레지락, 작은섬옆굴의 레지아이스, 고대의무덤의 레지스틸은 Lv.40입니다. [사막유적](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/maps/DesertRuins/scripts.inc) · [작은섬옆굴](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/maps/IslandCave/scripts.inc) · [고대의무덤](https://github.com/pret/pokeemerald/blob/9103e529c2fbdd7add4a1ff3350c6c1f92112c42/data/maps/AncientTomb/scripts.inc)
