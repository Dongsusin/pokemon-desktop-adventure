# 가라르 본토의 포켓몬 출현

《포켓몬스터소드》 본편의 40개 지점에서 일반 포켓몬 313종을 만날 수 있다. 1~10번도로, 광산, 숲, 일부 마을의 낚시터와 와일드에리어 17구역이 대상이다. 숲 입구와 안쪽, 2번도로와 건너편 호숫가, 8번도로와 눈길, 9번도로와 키르쿠스만·스파이크마을 변두리를 따로 집계했다. 배포·선물, 카레 캠프, 맥스 레이드배틀, 익스팬션 패스의 섬·설원·배회 전설은 산책 출현표에서 제외했다.

## 원작 자료

- 풀숲 심볼, 잠복, 비행·지하·수면, 낚시와 강한 고정 심볼은 pkNX 추출 자료를 바탕으로 만든 owoow의 소드 테이블을 사용했다. 일반 슬롯의 비중은 슬롯의 양 끝을 포함한 길이이고 각 행의 총합은 100이다. [소드 출현표의 고정 리비전](https://github.com/LegoFigure11/owoow/tree/abeccdf1fc94a1cb80cbd1790a9ee77028f2eccd/owoow.Core/Resources/Sword)
- 도로별 유효 날씨, 지형 경계와 흔드는 나무의 종·레벨을 pkNX와 PKHeX의 소드 원본 귀속 데이터로 대조했다. 다리아래 벌판과 스톤즈들판이 공유하는 경계의 나무도 양쪽에서 만날 수 있다. [pkNX 지점·날씨 판정](https://github.com/kwsch/pkNX/blob/master/FlatBuffers/SWSH/Gen8/Wild/EncounterTableUtil.cs) · [PKHeX 심볼·숨은 조우 테이블](https://github.com/kwsch/PKHeX/tree/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Resources/legality/wild/Gen8)
- 본편 열매나무 20개 지점은 소드의 숨은 조우와 지역별 나무 확률을 사용한다. 햇살비추는숲 나무에서 탐리스와 체리버가, 역린호수 나무에서 요씽리스와 체리버가 등장한다. [나무와 출현 지점](https://www.serebii.net/swordshield/berrytrees.shtml) · [햇살비추는숲 출현표](https://www.serebii.net/pokearth/galar/dappledgrove.shtml) · [역린호수 출현표](https://www.serebii.net/pokearth/galar/lakeofoutrage.shtml)
- 루미너스메이즈숲은 사용 중인 잠복 테이블과 버섯에서 등장하는 메롱꿍 Lv.31·쏘겨모 Lv.38을 적용했다. 9번도로 북쪽의 얼음귀신 Lv.55와 키르쿠스만의 케오퍼스 Lv.50도 원작 지점으로 분리했다. [PKHeX 본편 고정 조우](https://github.com/kwsch/PKHeX/blob/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Legality/Encounters/Data/Gen8/Encounters8.cs) · [루미너스메이즈숲 지형별 조우](https://www.serebii.net/pokearth/galar/glimwoodtangle.shtml)

## 산책에서 뽑는 방법

같은 장소·날씨에서 실제로 사용할 수 있는 일반 지형과 세부 풀숲의 테이블을 같은 비중으로 고른다. 각 테이블 안에서는 원작 확률로 종을 뽑고, 해당 레벨 범위의 정수를 같은 확률로 뽑는다. 강한 고정 심볼이 있는 지역에서는 전체 산책의 5%를 이 그룹에 배정하고 해당 날씨의 후보 중에서 균등하게 뽑는다. 터프마을처럼 고정 심볼만 있는 장소는 그 포켓몬이 100%다. 1번도로의 탐리스는 눈에 보이는 심볼에서 50%, 풀숲 잠복에서 40%여서 산책에서의 합산 확률이 45%다.

와일드에리어의 날씨는 현지 날짜를 따르며 지도와 실제 조우가 같은 표를 쓴다. 전 구역 공통 날씨가 기록된 날짜에는 해당 날씨를 사용한다. 나머지 날짜에는 구역별로 하루마다 순환하는 데스크톱용 예보를 사용한다. 배지 3개부터 눈보라·모래바람, 가라르 우승 이후부터 짙은 안개가 열린다. 해금 전 눈보라는 눈, 모래바람은 쾌청, 짙은 안개는 맑음으로 표시한다. 우승 뒤에는 와일드에리어의 Lv.60 미만 출현이 Lv.60이 되고, 각 구역에 Lv.65의 고정 심볼 한 종이 추가된다. [포켓몬 공식 와일드에리어 소개](https://swordshield.pokemon.com/en-us/gameplay/wild-area/) · [공통 날씨 날짜와 해금 조건](https://www.serebii.net/swordshield/weather.shtml) · [해금 전 날씨 대체](https://bulbapedia.bulbagarden.net/wiki/Wild_Area) · [우승 후 출현하는 Lv.65 배우르](https://www.powerpyx.com/pokemon-sword-shield-dubwool-location/)

너클시티 에너지플랜트의 타워톱에서 배지 8개를 얻은 뒤 무한다이노 Lv.60, 가라르 우승 뒤 자시안 Lv.70이 열린다. 기존 데스크톱 모험 규칙에 따라 전설 조우 확률은 한 번에 총 0.65%다. 두 종의 조건이 모두 충족되면 전설 조우 안에서 같은 가중치를 쓴다. [원작 전설전](https://www.serebii.net/swordshield/legendary.shtml) · [타워 정상의 위치 코드 66](https://github.com/kwsch/PKHeX/blob/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Resources/text/locations/gen8/text_swsh_00000_en.txt)
