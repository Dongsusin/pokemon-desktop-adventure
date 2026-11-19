# 아이템 이미지 출처

원작 포켓몬스터 시리즈의 가방 아이콘을 담은 PokéAPI 스프라이트 저장소에서 아래 PNG 파일을 가져왔습니다. 투명 PNG의 원본 픽셀을 사용합니다. 한국어 명칭은 PokéAPI의 아이템 데이터와 [포켓몬코리아 공식 표기](https://www.pokemonkorea.co.kr/pokemoncard_ranking)를 참고했습니다. 아이템 효과와 수치는 이 게임의 규칙을 따릅니다. [PokéAPI 아이템 스프라이트](https://github.com/PokeAPI/sprites/tree/c0542f7c51215d9672439012838c99f520596cbd/sprites/items)

| 게임 파일 | 원작 이름 | 원본 PNG |
| --- | --- | --- |
| `potion.png` | 상처약 | [`potion.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/potion.png) |
| `superPotion.png` | 좋은상처약 | [`super-potion.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/super-potion.png) |
| `pokeball.png` | 몬스터볼 | [`poke-ball.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/poke-ball.png) |
| `greatBall.png` | 수퍼볼 | [`great-ball.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/great-ball.png) |
| `ultraBall.png` | 하이퍼볼 | [`ultra-ball.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/ultra-ball.png) |
| `muscleBand.png` | 힘의머리띠 | [`muscle-band.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/muscle-band.png) |
| `guardCharm.png` | 진화의휘석 | [`eviolite.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/eviolite.png) |
| `swiftBerry.png` | 캄라열매 | [`salac-berry.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/salac-berry.png) |
| `trailStone.png` | 딱딱한돌 | [`hard-stone.png`](https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/items/hard-stone.png) |

아이템 이미지의 저작권은 The Pokémon Company 등 원작 권리자에게 있습니다. [PokéAPI 저작권 안내](https://github.com/PokeAPI/sprites/blob/c0542f7c51215d9672439012838c99f520596cbd/LICENCE.txt)

기존 저장에 있던 힘의머리띠, 진화의휘석 등은 같은 아이콘 경로를 사용합니다.

## 프렌들리숍

445종의 도구 모두 오프라인 PNG를 사용합니다. 432종에는 해당 도구의 그림을 연결했고, 전용 그림이 없는 13종에는 분류 아이콘을 표시합니다. 공용 아이콘은 마우스를 올리면 구분할 수 있습니다. [도구 스프라이트](https://github.com/PokeAPI/sprites/tree/c0542f7c51215d9672439012838c99f520596cbd/sprites/items)

프로젝트 루트에서 `node tools/build-shop-icons.mjs`를 실행하면 도구별 경로와 PNG를 재생성합니다. 가져온 원본의 Git 블롭 ID와 추가 자료의 SHA-256을 검사합니다. [품목별 추가 자료와 해시](../../tools/data/shop-icon-supplement.json) · [메가스톤·전용 Z크리스털의 대응 자료](https://github.com/smogon/pokemon-showdown/blob/5b88c476113d51a939bddbcd00b5cd182a5d8058/data/items.ts)
