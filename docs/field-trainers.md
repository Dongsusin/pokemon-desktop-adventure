# 지방별 필드 트레이너

도로, 숲, 광산, 선박과 악의 조직 거점에서 만나는 선택 대결이다. 인물의 소속과 대표 파트너, 원작에서 활동한 장소를 참고했다. 표의 각 행은 이 게임에서 도전할 수 있는 순서다. 초반 동료는 포켓몬 한두 마리로 시작하고, 후반 보스와 라이벌은 여러 마리를 상대하는 배틀로 이어진다. 알로라의 조건은 현지 캠페인의 시련·큰 시련 완료 개수로 계산한다.

| 지방 | 등장 순서 | 참고 자료 |
| --- | --- | --- |
| 관동 | 상록숲의 지우 → 달맞이산의 로사·로이 → 상트앙느호의 그린 → 실프주식회사의 비주기 | [포켓몬 TV 3화](https://www.youtube.com/watch?v=ObtS79k2NM4) · [로켓단 공식 소개](https://pokemonletsgo.pokemon.com/en-us/kanto-region/) · [피카츄 버전 트레이너 파티](https://github.com/pret/pokeyellow/blob/master/data/trainers/parties.asm) |
| 성도 | 무궁시티의 실버 → 진청시티의 수호 → 황토마을의 아테나 → 라디오타워의 아폴로 | [하트골드·소울실버 공식 인물 소개](https://www.pokemon.co.jp/game/ds/hgss/character.html) · [크리스탈 버전 트레이너 파티](https://github.com/pret/pokecrystal/blob/master/data/trainers/parties.asm) |
| 호연 | 103번도로의 봄이 → 보라시티의 민진 → 굴뚝산의 마적 → 해저동굴의 아강 | [민진과 랄토스](https://www.pokemon.co.jp/ex/oras/character/15.html) · [마그마단](https://www.pokemon.co.jp/ex/oras/character/03.html) · [아쿠아단](https://www.pokemon.co.jp/ex/oras/character/04.html) |
| 신오 | 203번도로의 용식 → 영원의 숲의 모미 → 강철섬의 현이 → 창기둥의 태홍 | [신오의 라이벌과 갤럭시단](https://diamondpearl.pokemon.com/en-gb/story/) · [플라티나 트레이너 데이터](https://github.com/pret/pokeplatinum/tree/main/res/trainers) |
| 하나 | 산가지목장의 휴이 → 4번도로의 벨 → 전기돌동굴의 N → 플라스마 프리깃의 아크로마 | [블랙 2·화이트 2 공식 인물 소개](https://www.pokemon.co.jp/ex/b2w2/characters/character02.html) |
| 칼로스 | 수미마을의 사나 → 5번도로의 티에르노 → 향전시티의 세레나 → 플레어단 비밀기지의 플라드리 | [칼로스의 친구들](https://www.pokemon.co.jp/ex/xy/character/02.html) · [플라드리](https://www.pokemon.co.jp/ex/xy/character/other/02.html) |
| 알로라 | 릴리마을의 하우 → 5번도로의 글라디오 → 수상한 저택의 구즈마 → 에테르파라다이스의 루자미네 | [썬·문 공식 인물 소개](https://www.pokemon.co.jp/ex/sun_moon/character/) · [구즈마](https://www.pokemon.co.jp/ex/sun_moon/character/10.html) · [루자미네](https://www.pokemon.co.jp/ex/sun_moon/character/14.html) |
| 가라르 | 2번도로의 호브 → 가라르광산의 비트 → 스파이크마을 변두리의 마리 → 에너지플랜트의 로즈 | [소드·실드 공식 인물 소개](https://swordshield.pokemon.com/en-us/people-galar-region/) |
| 팔데아 | 티스푼마을의 네모 → 악 군단 아지트의 피나 → 로스트 사막의 페퍼 → 오렌지 아카데미의 모란 | [스칼렛·바이올렛 공식 인물 소개](https://www.pokemon.co.jp/ex/sv/ja/character/) · [세긴단 보스 피나](https://www.pokemon.co.jp/ex/sv/ja/character/230112_06/) · [페퍼](https://www.pokemon.co.jp/ex/sv/ja/character/220803_01/) |

지우는 상록숲에서 만난 캐터피와 피카츄로 출전한다. 로사·로이는 하나의 지도 표식과 파티를 공유하며, 아보·나옹·또가스가 차례로 나온다. 모미의 럭키와 현이의 루카리오처럼 원작에서 동행하던 인물의 파트너와도 직접 겨룰 수 있다.

지도에 표시하는 출전 팀, 레벨, 도전 조건은 이 게임의 지방별 진행 속도와 레벨 상한에 맞춘 고정 편성이다. 파티에는 배틀에 필요한 레조넌스 모션이 있는 포켓몬을 넣었다. 피나는 악 군단의 자망칼로 출전하고, 로즈는 슈바르고·너트령·나이킹·기기기어르를 사용한다. [지역별 편성 데이터](../src/game/regions/fieldTrainers.ts)
