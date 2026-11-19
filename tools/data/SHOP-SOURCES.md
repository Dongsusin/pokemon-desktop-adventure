# 프렌들리숍 상품 데이터

2026년 11월 19일 기준, 관동부터 팔데아까지의 본편과 리메이크, 『Pokémon LEGENDS 아르세우스』 및 『Pokémon LEGENDS Z-A』의 「M차원러시」까지의 가방 도구를 수록합니다. 상품에는 지닌도구·중요한 도구·배포 열매·기술머신·제작법도 들어갑니다. 기술머신 번호가 여러 작품에 등장하면 최신 수록 작품의 기술 하나를 표시합니다. 원작에 없는 데스크톱 기능은 상점과 가방의 실제 사용 안내에 따릅니다.

## 품목과 식별

- PokéAPI의 도구, 게임별 가방 번호, 한국어 이름, 기술머신·기술·타입 테이블을 연결합니다. 새 저장 키에는 도구의 영문 식별자를 사용합니다. 기존 게임에 있던 도구는 예전 저장 키를 그대로 사용합니다. [고정한 PokéAPI 데이터](https://github.com/PokeAPI/pokeapi/tree/e98f2ad82fc61c46036689ecb10c3aa89d562d6b/data/v2/csv)
- PKHeX에 수록된 원작 영문·한국어 문자열과 작품별 가방 목록으로 누락된 도구를 보충합니다. 미르시티의 이차원 나무열매, 카나리인형 단계, 신오의 석판, 히스이의 레시피와 완제품을 구분합니다. 배포된 소드·실드 다이맥스 결정 12개를 수록합니다. 빈 번호, 미배포 결정 슬롯, 가방에 보유할 수 없는 내부 이벤트 상태는 제외합니다. [원작 문자열](https://github.com/kwsch/PKHeX/tree/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Resources/text/items) · [가방 번호 목록](https://github.com/kwsch/PKHeX/tree/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Items)
- 2세대 고유 열매·메일은 당시의 명칭으로, 3세대 e-Reader 배포 열매 12개는 배포명으로 표시합니다. 한국어판이 없던 e-Reader 배포품은 영문 이름으로도 검색할 수 있습니다. [배포 열매 목록](https://github.com/kwsch/PKHeX/blob/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Saves/Substructures/Gen3/EReaderBerrySettings.cs)
- 이 카탈로그의 범위는 위 RPG들의 가방입니다. 옷장 의상, 개별 조리 결과물, 전용 라이브 서비스의 기간제 모집권·유료 상품은 각각 해당 작품의 별도 시스템에 속합니다.

## 가격

1. 확인된 포켓머니 상점 구매가 중 가장 최근 작품의 가격을 우선합니다. 미르시티의 포켓몬센터·스톤숍·상점, 팔데아 딜리버드 파우치·럭키즈·식재료점, 축복마을의 잡화점·공작점·은행상회 판매품을 포함합니다. 몬스터볼 100원, 슈퍼볼 300원, 하이퍼볼 600원, 상처약 150원, 리자몽나이트X 100,000원이 예입니다. 작품에 따라 동작이 다른 헤비볼과 히스이의 헤비볼은 별도 품목입니다. [미르시티 상점](https://www.dittobase.com/legends-za/items) · [미르시티 볼 판매가](https://altissimo1.github.io/Supplementary-Series/Legends/Legends-Z-A/poke-balls.html) · [미르시티 나무열매](https://altissimo1.github.io/Supplementary-Series/Legends/Legends-Z-A/berry-stalls.html) · [민트 판매점](https://altissimo1.github.io/Supplementary-Series/Legends/Legends-Z-A/mint-stalls.html) · [팔데아 도구 자료](https://www.dittobase.com/scarlet-violet/items) · [축복마을 상점](https://altissimo1.github.io/Supplementary-Series/Legends/Legends-Arceus/jubilife-village-shops.html)
2. 실제 상점 구매가를 특정하기 어려운 품목은 PokéAPI에 양수로 기록된 도구 기준가를 사용합니다. 이 값에는 원작 가게에서 일반 판매하지 않는 물건의 기준값도 있습니다. 포켓머니 구매가, 기준가, 데스크톱 설정가는 서로 다른 출처 표식을 사용합니다.
3. 현금 가격이 없거나 희귀품에 명목상 극소액만 지정된 경우, 데스크톱 가격을 설정합니다. 예를 들어 마스터볼은 100,000원, 미판매 메가스톤은 50,000원, 미판매 규토리볼은 10,000원, 이차원 나무열매는 1,500원입니다. 내용물이 세대에 따라 달라진 기술머신은 현재 기술의 위력을 기준으로 가격을 책정합니다. VP·BP·LP·공적 포인트·메가조각·교환 전용 통화를 포켓머니 판매가로 환산하지 않습니다.

프로젝트 최상위에서 `node tools/build-shop-catalog.mjs`를 실행하면 고정한 원천 리비전과 [소매 판매가 스냅샷](shop-offers.json)에서 게임에 포함되는 JSON을 재생성합니다. 새 자료로 갱신할 때에는 해당 작품의 현금 판매 경로를 확인한 뒤 스냅샷과 원천 리비전을 갱신합니다. 게임 실행 중 네트워크 요청은 필요하지 않습니다.
