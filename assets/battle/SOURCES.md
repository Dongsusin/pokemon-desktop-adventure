# 트레이너 배틀 도트와 경기장

실시간 배틀용 그림은 [Boying의 포켓몬 레조넌스 v3.0.0 Windows 배포본](https://reso.jhcloud.kr/)에 수록된 비영리 팬게임 리소스에서 가져왔습니다. 포켓몬 캐릭터의 권리는 Nintendo, Creatures, GAME FREAK 및 해당 권리자에게 있습니다.

**포켓몬**. [PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab)의 탐험대 계열 8방향 그림을 사용합니다. 원작 그림은 CHUNSOFT / Spike Chunsoft, Nintendo, Creatures, GAME FREAK의 작품입니다. 커뮤니티 그림은 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)으로 배포됩니다. 배틀에 사용하는 981종과 추가 46폼의 그림을 바닥 기준점에 맞춰 재배치하고, 종별 PNG에 묶었습니다. 방향 순서와 프레임 지속 시간은 배포본의 측정값입니다. 각 그림의 원작자와 동작별 기여 내역은 [SPRITE-CREDITS.txt](SPRITE-CREDITS.txt), 작가명 대조표는 [SPRITE-ARTISTS.txt](SPRITE-ARTISTS.txt), 라이선스 전문은 [SPRITE-LICENSE.md](SPRITE-LICENSE.md)에 있습니다. 방향별 세트가 없는 44종과 추가 12폼은 [PokéRogue](https://github.com/pagefaultgames/pokerogue-assets)의 종별 정면 도트를 사용합니다. 정면 세트 중 6종과 추가 9폼처럼 원본이 한 장인 경우에는 발을 기준으로 호흡, 걸음, 공격 예비 동작과 반동을 재생합니다. 원본 시트의 프레임을 순서대로 다시 묶었으며 해당 그림에는 CC BY-NC-SA 4.0이 적용됩니다. [원본별 목록](FRONT-SPRITES.txt) · [출처와 작가](FRONT-CREDITS.txt) · [그림 라이선스](FRONT-LICENSE.txt)

**경기장**. Another Red의 Pokémon Essentials 커뮤니티 타일로 Boying이 구성한 전장 이미지에서 실제 플레이 구역을 잘라 사용합니다. 관동·성도·신오의 체육관 전용 배경 24개, 리그와 공용 지형 10개가 포함되어 있습니다. 회색체육관에는 같은 타일 팩의 Object rock과 Object boulder를 실제 배틀 영상에 맞춰 배치했습니다. 다른 지방의 체육관과 시련은 관장의 타입에 맞는 전장을 선택합니다. [전장 제작·원출처 크레딧](GROUND-CREDITS.txt)

**재생성**. Python과 Pillow를 설치하고 공개 배포본에서 추출한 `resources/app.asar` 경로를 `python tools/build-battle-art.py <app.asar>`에 넘기면 PNG와 프레임 목록을 다시 만들 수 있습니다. 앱 실행과 설치에는 이 작업이 필요하지 않습니다.

트레이너 측면 도트는 [원본 시트 목록](trainers/SOURCES.md), 기술 효과음은 [Pokémon Reborn 및 PokéRogue 크레딧](audio/SOURCES.md)에 기록했습니다.
