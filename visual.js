'use strict';

import {
  Text
} from './text.js';

import {
  Particle
} from './particle.js';

export class Visual {
  constructor() {
    this.text = new Text();

    /**
     * PIXI.Texture 개념 정리 한 번 하고 가자.
     * 
     * Pixi에서 Texture란 무엇인가?
     * Pixi는 기본적으로 WebGL상에서 GPU를 이용해 이미지를 렌더하는데,
     * 그러려면 일반적인 이미지 파일을 GPU가 처리할 수 있는 포맷으로 변경해줘야 함.
     * 이처럼 WebGL이 렌더할 수 있도록 변경된 이미지 포맷을 'texture'라고 함.
     * 
     * sprite 객체가 이미지를 display하려면,
     * 일반적인 이미지 파일을 WebGL texture로 변환해줘야 한다.
     * 
     * 이 작업들을 효과적이고 빠르게 해주기 위해서
     * pixi에서는 sprite들이 필요한 texture들을 참조하거나 저장할 수 있도록
     * texture cache를 이용한다.
     * 
     * pixi에서는 일반적인 이미지 파일을 로드한 후 texture로 변환하여 texture cache에 로드해두는 작업을
     * 한방에 해결해주는 loader라는 내장 객체를 이용한다.
     * 그래서 일반적으로는 PIXI.loader 를 이용해서 이미지를 텍스쳐를 변환하고 나서
     * PIXI.Sprite(PIXI.loader.resources[image url].texture); 이런 식으로 sprite에서 사용을 하는 게 
     * 최적화와 효율성에 있어서 가장 좋기 때문에 이렇게 하는 경우가 많음.
     * (이게 우리가 pixi basic에서 사용했던 방식들임.)
     * 
     * 그러나, 간혹 어떤 이유로 인해 js 이미지 객체나 canvas로부터 바로 texture를 만들어야 하는
     * 경우가 있는데, 이럴 때 사용하는게 BaseTexture, Texture 클래스임. 
     * 
     * 또 PIXI.Texture.from 함수를 이용하면 
     * frame id, image url, video url, canvas element, video element, base texture 등의
     * 소스를 전달하여 새로운 texture를 만들어낼 수 있도록 함.
     */
    this.texture = PIXI.Texture.from('particle.png'); // particle.png는 흰색 원 모양임. -> particle 모양인듯?

    this.particles = [];

    this.mouse = {
      x: 0,
      y: 0,
      radius: 100,
    };

    document.addEventListener('pointermove', this.onMove.bind(this), false);
  }

  show(stageWidth, stageHeight, stage) {
    if (this.container) {
      // 이제 알겠다. 만약 this.container에 ParticleContainer가 이미 생성되어 있다면 
      // root stage에 addChild된, 해당 ParticleContainer가 생성된 this.container를 제거해주고
      // 다시 this.container에 새로운 ParticleContainer를 override하여 root stage에 addChild 하라는 뜻.
      stage.removeChild(this.container);
    }

    this.pos = this.text.setText('A', 2, stageWidth, stageHeight);

    /**
     * PIXI.ParticleContainer
     * 
     * 얘는 sprite 하나를 엄청나게 빠른 속도로 수백개 만들어야 할 때 사용하는 Container임.
     * sprite가 약간 particle같은 입자 모양으로 render되서 수백개의 particle들이 render되어야 하는 경우
     * 사용하는 container임.
     * 
     * PIXI.ParticleContainer의 단점은 대부분의 고급 기능들이 작동되지 않는다는 것.
     * 기본적인 transform (position, scale, rotation) 및 tint같은 몇가지 고급 기능만 구현 가능함.
     * 
     * let container = new ParticleContainer();
     * 
     * for (let i = 0; i < 100; ++i)
     * {
     *   let sprite = PIXI.Sprite.from("myImage.png");
     *   container.addChild(sprite);
     * }
     * 
     * 이런식으로 particle 역할을 하는 sprite를 하나 생성해놓고, 
     * for loop 안에서 particleContainer에다가 addChild 해주면,
     * 해당 파티클 컨테이너 안에 for loop 횟수만큼 sprites가 반복적으로 render될거임.
     * 아주 빠른 속도로!
     * 
     * 얘와 관련하여 객체 형태로 전달하는 파라미터들의 종류들은 공식문서를 참고할 것.
     */
    this.container = new PIXI.ParticleContainer(
      this.pos.length, {
        vertices: false,
        position: true,
        rotation: false,
        scale: false,
        uvs: false,
        tint: false,
      }
    );
    stage.addChild(this.container);
    // app.js에서 this.stage로 넘겨받은 root container안에
    // for loop 횟수만큼 render된 particle sprite들이 담긴 ParticleContainer를 addChild 해준 것.

    // 근데 app.js의 animate 메소드에서 this.stage를 this.renderer에서 렌더해주고 있지?
    // 그럼 어떻게 될까? app.js에서 PIXI.Renderer로 생성한 WebGL view에
    // ParticleContainer 안에 담긴 수많은 sprite들이 실제로 렌더되겠지?

    this.particles = [];

    // this.pos.length가 뭐에 대한 length라는 거지?
    // text.js에서 Text 클래스의 생성자의 마지막 부분을 보면
    // this.dotPos에서 return받은 particles 배열을 리턴해주는 걸 볼 수 있음.
    // particles는 캔버스 전체에서 색상값이 존재하는 픽셀들의 x,y좌표값을 이중 for loop를 돌면서
    // 순서대로 push해놓은 배열임.
    for (let i = 0; i < this.pos.length; i++) {
      // Particle 인스턴스에서는 this.texture(흰색 원 모양의 이미지)를 받아서 sprite를 하나 생성하고
      // text 인스턴스에서 가져온 픽셀 좌표값을 담아놓은 배열인 particles의 x,y좌표값을 이용하여
      // 해당 sprite의 크기, x,y좌표값, 좌표값의 변화량을 지정해 줌.
      const item = new Particle(this.pos[i], this.texture);

      // 이 흰색 원 모양 이미지 texture로 만든 sprite를 ParticleContainer인
      // this.container에 추가해줬으니 위에서 말한대로 엄청 빠른 속도로 for loop를 돌면서 
      // this.pos.length 개수만큼의 sprite(particle)이 생성될거임.
      this.container.addChild(item.sprite);

      // 새롭게 생성된 Particle 인스턴스를 this.particles 배열에 차곡차곡 push해놓음.
      this.particles.push(item);
    }
    // for loop를 다 돌고나면 색상값이 존재하는 픽셀들 각각에 particle sprite이 생성되겠군.
  }

  animate() {
    // 매 프레임마다 for loop를 돌려서 this.particle에 담긴 
    // 각각의 Partcle 내부의 sprite의 x,y좌표값을 변화시켜줌.
    for (let i = 0; i < this.particles.length; i++) {
      const item = this.particles[i];
      const dx = this.mouse.x - item.x; // dx = distance of x 이거의 줄임말 같음.
      const dy = this.mouse.y - item.y;
      // 결론적으로 각 픽셀에 존재하는 sprite들의 위치와 현재 마우스가 움직인 위치 사이의 x, y 각각의 거리값을 계산함.
      // 이걸 this.particles에 담긴 모든 픽셀들에 대하여 해줌.

      const dist = Math.sqrt(dx * dx + dy * dy); // 두 지점 사이의 실제 거리(직각삼각형 빗변의 길이)를 계산해 줌

      // minDist가 110인데... 이 radius들이 뭐에 대한 radius지? 
      // radius값이 어떤 원을 만드는 데 사용한 radius인지도 알 수가 없고...
      const minDist = item.radius + this.mouse.radius;

      // 두 지점 사이의 거리가 110보다 작을 경우 if block을 수행함.
      if (dist < minDist) {
        /**
         * atan2의 기본 개념을 다시 정리해야 할 필요가 있다.
         * 
         * atan2는 기본적으로, 두 점 사이의 절대각도를 return해주는 함수이다.
         * 뭔 말이냐면, 어떤 두 점 A, B를 연결한 벡터가 있다고 치면,
         * 그 벡터와 x축이 이루는 각도를 구해준다는 뜻임. 한마디로 벡터의 기울기를 구해준다고 보면 됨.
         * 
         * 그런데, 우리가 원래는 Math.atan2(y, x)를 하면 (0, 0)에서 (x, y)까지 연결한 벡터와 양의 x축의 각도를
         * 라디안으로 리턴해준다고 하지 않았었나?
         * 
         * 그렇지. 한마디로 두 점 A, B가 (0, 0), (x, y)인거야. 
         * y - 0 = y, x - 0 = x니까!
         * 두 점 중에서 한 점이 원점인 경우라면 저게 맞는거지.
         * 
         * 그런데 만약, 원점이 아닌 두 점 A, B를 연결한 벡터의 기울기, 각도를 구해주고 싶다면?
         * 만약 두 점이 (x1, y1), (x2, y2)라고 친다면,
         * Math.atan2(y2 - y1, x2 - x1)을 해주면 됨. 이렇게 하면 원점이 아닌 두 점을 연결한 벡터의 각도를 구할 수 있음.
         * 
         * atan2는 이런 식으로 두 점 사이의 각도를 구할 때 주로 사용한다고 보면 됨.
         * 
         * 그럼 아래에 설명된 Math.atan2(dy, dx)가 이해가 가지?
         * 결국 const angle에는 마우스가 움직인 지점과 각 sprite의 위치점을 연결한 벡터의 각도(기울기)를 구해준다고 보면 됨.
         */
        const angle = Math.atan2(dy, dx);

        /**
         * 얘는 원의 좌표를 구하는 공식을 이용해서,
         * 반지름이 minDist인 원 위에서 
         * angle에 해당하는 x,y좌표값을 구해준 것.
         * 
         * 근데 item.x, y는 왜 더해주는 걸까?
         * 한마디로, 원점이 (item.x, item.y), 즉 해당 픽셀이고 
         * 반지름이 minDist(110)인 원 위에서의 좌표를 구하려는 것!
         * 
         * 결론적으로, tx, ty는
         * 각 sprite의 위치점을 원점으로 하고, 반지름이 110인 원의 둘레와
         * 각 sprite의 위치점과 마우스가 움직인 지점을 연결한 벡터가 교차하는 지점의 좌표값을 구해준다는 것.
         */
        const tx = item.x + Math.cos(angle) * minDist;
        const ty = item.y + Math.sin(angle) * minDist;

        // ax, ay에는 해당 픽셀을 중심으로 반지름이 110인 원 위의 좌표 tx, ty와 
        // 현재 프레임에서 마우스가 움직인 위치 사이의 x, y 각각의 거리값을 계산함.
        const ax = tx - this.mouse.x;
        const ay = ty - this.mouse.y;
        item.vx -= ax;
        item.vy -= ay; // 각각의 particle 내부 sprite의 좌표값 변화량에 ax, ay만큼을 빼줌. 
        /**
         * particle.js의 draw메소드에서
         * 각각의 자리에 있는 sprite들을 움직이려면, vx, vy를 변화시켜야 한다는 걸 알게 되었고,
         * vx, vy를 변화시키는건 ax, ay를 vx, vy에 빼줄 수 있느냐에 달려있다는 걸 알았다.
         * 
         * 그럼 ax, ay가 빼줄 수 있고, 어떨 때 빼줄 수 없는걸까?
         * 기본적으로, 이 ax, ay값이 할당되는 if block 자체가
         * dist(마우스 지점과 각 sprite의 지점 사이의 거리)가 110보다 작은 경우에만 실행되니까
         * ax, ay도 마우스 지점과의 거리가 110보다 작은 sprite들에 대해서만 ax, ay값을 할당받는거지.
         * 
         * 이 말은, 마우스 지점과의 거리가 110보다 큰 sprite들은 ax, ay값 자체가 아예 생성도 안되고
         * 생성이 안되니 item.vx,vy에 빼주지도 못한 채로 if block을 빠져나와서 
         * draw()메소드를 호출해줘야 하는 상황인거지.
         * 그럼 vx, vy도 결과적으로 계속 0이 되고 this.x, y도 변화하지 않겠지?
         * 
         * 그럼 ax, ay가 빼줄 수 있지만 0이 되는 경우와 
         * 0이 아닌 값으로 빼주는 경우는 어떻게 되는걸까?
         * 
         * 우선 ax, ay가 0이 되려면, tx, ty의 값이 this.mouse.x,y랑 같아야겠지.
         * 그러려면 dist가 110, 즉 dist = minDist 이어야 됨. 마우스 지점과 sprite 지점의 거리가
         * minDist랑 똑같은 110이면 ax, ay는 0이 됨. 
         * 근데, if block의 조건문만 봐도, dist < minDist 인 경우에만 if block 을 수행할 수 있다고 하니까,
         * ax, ay가 0이 되어서 item.vx, vy에 각각 빼주는 건 불가능하겠지?
         *  
         * 즉, dist는 minDist보다 항상 작기 때문에, (this.mouse.x, this.mouse.y)는 (tx, ty)보다 언제나
         * 좌표상에서 렌더된 sprite와 더 가까울 수밖에 없다.
         * 
         * 이 말은, (this.sprite.x, this.sprite.y), (this.mouse.x, this.mouse.y), (tx, ty) 세 점이
         * 나란히 minDist 길이 만큼의 반지름 상에 놓여있다면, (this.mouse.x, this.mouse.y) 좌표가 언제나 
         * sprite 지점과 더 가까울 수밖에 없다는 거지. 
         * 
         * 그래서 (this.mouse.x, this.mouse.y)가 반지름 상에서 (tx, ty)를 지나 sprite 지점을 향해
         * 이동한 만큼의 값(tx - this.mouse.x, ty - this.mouse.y. 즉, ax, ay)을 
         * vx, vy에 빼줘서 sprite를 이동시키려는 것.
         * 
         * 그러다보니, 마우스를 sprite에 가깝게 움직이더라도 
         * (this.mouse.x, this.mouse.y)와 sprite 지점 사이에는 항상
         * minDist(110) 만큼의 거리가 유지가 되는거임.
         * 
         * note_capture.jpg에서 그림으로 정리했으니 참고하면서 복습해볼것.
         */
      }

      // 각각의 particle 내부 sprite들의 실제 x,y좌표값을 변화시켜줌.
      item.draw();
    }
  }

  onMove(e) {
    // this.mouse 객체의 x, y값을 pointer가 움직인 브라우저 상의 좌표값으로 계속 override해줌.
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }
}