# 트레이너 배틀 도트와 경기장

실시간 배틀용 그림은 [Boying의 포켓몬 레조넌스 v3.0.0 Windows 배포본](https://reso.jhcloud.kr/)에 수록된 비영리 팬게임 리소스에서 가져왔습니다. 포켓몬 캐릭터의 권리는 Nintendo, Creatures, GAME FREAK 및 해당 권리자에게 있습니다.

**포켓몬**. [PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab)의 탐험대 계열 8방향 그림을 사용합니다. 원작 그림은 CHUNSOFT / Spike Chunsoft, Nintendo, Creatures, GAME FREAK의 작품입니다. 커뮤니티 그림은 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)으로 배포됩니다. 961종과 추가 44폼의 그림을 바닥 기준점에 맞춰 종별 PNG에 묶었습니다. 방향 순서와 프레임 지속 시간은 배포본의 측정값입니다. [원작자·동작별 기여 내역](SPRITE-CREDITS.txt) · [작가명 대조표](SPRITE-ARTISTS.txt) · [라이선스 전문](SPRITE-LICENSE.md)

**플레이 가능 모션**. v3.0.0의 `sprites8/sets`에서 해당 종 및 폼에 직접 지정된 Walk와 Attack을 확인합니다. 두 시트 모두 8방향의 모든 프레임에 그림이 있고 시간에 따라 픽셀이 실제로 바뀌어야 합니다. 빔·투사체·범위·회복 기술은 원본이 지정한 별도 발사 자세에도 같은 기준을 적용합니다. 이 조건을 만족하는 903개 세트가 발사 기술을 사용할 수 있습니다. 나머지 102개 세트에는 종별로 배울 수 있는 근접 기술만 허용합니다. [생성 및 판정 코드](../../tools/battle_motions.py)

**전투 기믹**. 메가진화는 레조넌스 v3.0.0의 `dist/data/species.json`에 지정된 원래 모습·변신 후 타입·종족값을 사용합니다. 원본 배우의 전용 Walk·Attack 도트가 있고 플레이 가능한 81개 원래 모습에서 변신할 수 있는 87개 메가폼을 수록했습니다. 그중 31폼은 별도의 발사 자세도 갖추고 있습니다. 선택지가 여러 개인 포켓몬은 배포본 순서에 따라 X/Y 또는 기본 메가/Z를 구분합니다. PMDCollab 그림과 Boying의 전용 그림은 각 원출처의 제작자 표기를 유지합니다. [메가폼별 도트 크레딧](gimmicks/SPRITE-CREDITS.txt)

메가진화(`Common:MegaEvolution2`, 20프레임)와 Z기술(`Common:ZPower`, 34프레임)의 발동 연출은 원본의 효과 셀을 시전자 중심, 초당 20프레임으로 합성했습니다. 활성화 이펙트에는 주변 포켓몬이 쓰는 전신 섬광을 포함하지 않습니다. Z기술과 다이맥스 기술의 타입별 명칭은 [PokéAPI 한글 기술명 데이터](https://github.com/PokeAPI/pokeapi/blob/e4f981e5cb03c1fe33d436b1ee8e1197fbb0af84/data/v2/csv/move_names.csv)를 따릅니다. [원작 이펙트 크레딧](gimmicks/MOVE-CREDITS.txt) · [레조넌스 제작자의 v3.0.0 배포·패치 기록](https://reso.jhcloud.kr/api/site)

**기술별 이펙트**. 원본의 `dist/data/anims/moves`에서 기존 기술 23개의 이름과 일치하는 타임라인을 확인했습니다. 20fps의 셀 순서, 위치, 각도, 배율, 배경 및 포켓몬 색상 효과와 사용한 PNG를 묶었습니다. 염동력은 원본에서도 포켓몬·배경 효과로 표현됩니다. 이미지는 Pokémon Reborn Team의 PRAS 시트를 포함하며 원본 배포본의 크레딧을 함께 제공합니다. [기술별 타임라인](../../src/renderer/move-clips.json) · [원작자·그림 출처](moves/CREDITS.txt)

**경기장**. Another Red의 Pokémon Essentials 커뮤니티 타일로 Boying이 구성한 전장 이미지에서 실제 플레이 구역을 잘라 사용합니다. 관동·성도·신오의 체육관 전용 배경 24개, 리그와 공용 지형 10개가 포함되어 있습니다. 회색체육관에는 같은 타일 팩의 Object rock과 Object boulder를 실제 배틀 영상에 맞춰 배치했습니다. 다른 지방의 체육관과 시련은 관장의 타입에 맞는 전장을 선택합니다. [전장 제작·원출처 크레딧](GROUND-CREDITS.txt)

**재생성**. Python과 Pillow를 설치하고 공개 배포본에서 추출한 `resources/app.asar` 경로를 `python tools/build-battle-art.py <app.asar>`에 넘기면 PNG와 프레임 목록을 다시 만들 수 있습니다. 앱 실행과 설치에는 이 작업이 필요하지 않습니다.

트레이너 측면 도트는 [원본 시트 목록](trainers/SOURCES.md), 기술 효과음은 [Pokémon Reborn 및 PokéRogue 크레딧](audio/SOURCES.md)에 기록했습니다.

**발사 위치**. 방향별 발사점(`mouth`)과 고정 자세(`hold`)를 종과 폼에 맞춰 적용합니다. 갸라도스에는 v3.0.0의 Shoot 4번 프레임 보정값을 사용합니다. 원본 발사점이 없는 방향 도트는 원본 발사 자세의 실루엣에서 위치를 측정했습니다. 도트의 바닥 기준점과 다이맥스 배율은 기술 경로와 화면 표시가 공유합니다. [변환·보완 좌표](../../tools/battle_emitters.py)
