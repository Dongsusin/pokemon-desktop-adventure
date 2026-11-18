# 성도지방 지도 및 야생 포켓몬 출처

## 포켓기어 지도

`town-map.png`는 《포켓몬스터 금》 게임보이 컬러용 포켓기어 지도입니다. 성도 화면 160×144픽셀 원본과 26~28번도로 및 포켓몬리그가 있는 관동 화면 왼쪽 40×144픽셀을 이어 붙여, 두 원작 화면의 위치를 한 장에 표시했습니다. 원본 8×8 타일, 배치, 팔레트를 사용했습니다. 이미지와 포켓몬은 원작 권리자에게 귀속됩니다. [원본 리비전](https://github.com/pret/pokegold/tree/2bbfba60051acfbed96d68fb5e40173a06df67d8/) · [원본 타일·배치·팔레트](https://github.com/pret/pokegold/tree/2bbfba60051acfbed96d68fb5e40173a06df67d8/gfx/pokegear)

52개 장소의 핀은 포켓기어의 랜드마크 픽셀 좌표입니다. 원본 관동 화면에 위치한 7개 장소에만 왼쪽에 배치한 성도 화면의 너비 160픽셀을 더했습니다. [원본 장소 좌표](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/data/maps/landmarks.asm)

## 출현 포켓몬

일반 전투는 《포켓몬스터 금》 영문판의 풀숲·동굴·파도타기 출현종과 레벨을 사용합니다. 앱의 한 장소는 원작의 관련 층과 지형을 함께 다룹니다. 날씨와 무관하게 아침·낮·밤을 같은 비율로 집계하며, 원작의 단계별 출현율과 슬롯 확률을 사용해 장소별 가중치를 계산했습니다. [성도 풀숲·동굴](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/data/wild/johto_grass.asm) · [성도 파도타기](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/data/wild/johto_water.asm) · [석영고원 방면 풀숲·동굴](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/data/wild/kanto_grass.asm) · [석영고원 방면 파도타기](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/data/wild/kanto_water.asm) · [원작 출현 슬롯 확률](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/data/wild/probabilities.asm)

원작의 고정 조우 중 방울탑의 칠색조 Lv.40과 소용돌이섬의 루기아 Lv.70은 앱에서 희귀 조우로 등장합니다. [칠색조](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/maps/TinTowerRoof.asm) · [루기아](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/maps/WhirlIslandLugiaChamber.asm)

## 체육관 배지

`gym-badges.png`는 원작 트레이너 카드의 배지 타일과 게임보이 컬러 팔레트를 사용했습니다. 앱의 체육관 도전 순서에 맞춰 배치했습니다. [원본 배지 타일](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/gfx/trainer_card/badges.png) · [원본 팔레트](https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/gfx/sgb/predef.pal)
