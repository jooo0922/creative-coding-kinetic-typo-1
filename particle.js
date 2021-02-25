'use strict';

const FRICTION = 0.86;
const MOVE_SPEED = 0.01;

export class Particle {
  constructor(pos, texture) {
    this.sprite = new PIXI.Sprite(texture);

    // scale은 로컬 좌표를 따라 해당 sprite의 단위크기를 지정해줌. 기본값은 1이며, 여기서는 0.2배로 줄임. 
    this.sprite.scale.set(0.2);

    // tint는 생성한 sprite(여기서는 흰색 원)에 tint? 색조, 색깔을 넣는 개념. hex value값이 들어감.
    // 여기서는 0x000000 검정색 틴트로 넣어줌. 브라우저에는 각각의 픽셀 자리에 검정색 원 모양의 sprite들이 렌더될거임.
    this.sprite.tint = 0x000000;
    // app.js에서 thresholdFilter로 해당 sprite의 색상값을 조절할 수 있기 때문에 이제는 필요없음.

    this.savedX = pos.x;
    this.savedY = pos.y; // this.savedX,Y는 초기의 sprite의 위치값을 저장해놓은 거 같음.
    this.x = pos.x;
    this.y = pos.y;

    // sprite의 anchor point(원점)를 기준으로 sprite의 위치값을 지정해 줌.
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // 계속 더해줘서 sprite의 좌표값에 변화를 주려는 속도값 같음.
    this.vx = 0;
    this.vy = 0;

    this.radius = 10;
  }

  draw() {
    // sprite의 x,y좌표값 변화량(속도)는 항상
    // 초기의 x,y좌표값에서 이전 프레임의 sprite의 x,y좌표값(this.x,y)를 뺀 값에서 0.1배로 해줌.
    // 이때 this.vx, vy는 항상 visual.js의 animate()메소드에서 ax, ay만큼 빼준 값이 할당되어 있음.
    /**
     * 그런데, 왜 어떤 경우에는 this.sprite.x,y가 움직이고, 어떤 경우에는 안움직이는 걸까?
     * 언뜻 보기에는 this.x,y가 변해야 할거 같아 보인다.. 그렇지 않으면
     * 그래야 this.savedX,Y - this.x,y 값이 0이 되어버리니, this.vx,vy는 변함이 없을 것이고,
     * 만약 ax, ay가 0이라면 vx,vy도 매 프레임마다 0이 할당될테니, FRICTION을 곱해도 소용이 없지.
     * 그럼 사실상 this.vx,vy는 계속 0이니까, this.x,y값에는 계속 변화가 없고, 그러니까 결국 this.sprite.x,y에는 변화가 없음.
     * 
     * 그럼 이 과정에서, 어떤 값이 변해야 하는걸까?  
     * 그러려면 this.vx,vy가 변해야지. 
     * 그럼 무엇이 vx, vy를 변화시키나? MOVE_SPEED? FRICTION? 얘내는 그냥 상수값인데?
     * this.x,y? 얘내는 this.vx,vy가 변하지 않으면 안 변해.
     *  
     * 결국 this.vx,vy값이 변하게 해주는 값은, visual.js에서 vx,vy에 각각 빼주는 ax, ay값이라는 걸 알 수 있다.
     * 아무리 프레임이 반복되어도 ax, ay가 vx, vy에 값을 빼주지 않는다면 vx, vy는 변하지 않는다.
     */
    this.vx += (this.savedX - this.x) * MOVE_SPEED;
    this.vy += (this.savedY - this.y) * MOVE_SPEED;

    // 언젠가는 sprite의 x,y좌표값이 이동을 멈추게 하기 위해서
    // 마찰력 값인 0.86을 매 프레임마다 곱해줌으로써 vx, vy가 언젠가는 0에 도달하게 만듦.
    this.vx *= FRICTION;
    this.vy *= FRICTION;

    // 계산한 vx, vy만큼을 매 프레임마다 this.x, y에 더해주고
    this.x += this.vx;
    this.y += this.vy;

    // this.x, y는 언제나 this.sprite.x,y의 좌표값으로 그대로 들어감.
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }
}
/**
 * 결국 마우스가 (tx, ty)를 지나 이동한 만큼 sprite도 이동시켜줘서 
 * sprite 지점과 마우스 지점 사이의 minDist만큼의 간격을 유지시켜준다는 것을 확인했음.
 * 
 * 그러나, vx, vy에는 이미 ax, ay가 할당되어 있기 때문에 sprite가 한 방향으로 한없이 이동하게 될거임.
 * 따라서 FRICTION을 매 프레임마다 vx, vy에 곱해줌으로써 프레임마다 값을 조금씩 줄여나가서 
 * 0에 가깝게 만듦으로써 어느 순간에는 더 이상 sprite가 움직이지 않도록 해준 것.
 * 
 * 또한 vx, vy에는 -ax, -ay를 각각 해줘서 sprite를 이동시키고 나서,
 * 원래의 위치로 돌아오게 하기 위해 초기의 sprite 위치값(this.savedX,Y)에 현재의 sprite 위치값을 빼준 값을
 * += 해서 -=하는 ax, ay와는 반대의 방향으로 sprite를 이동시키려고 함.
 * 
 * 그런데 이걸 그대로 += 해버리면 너무 빨리 원래 위치로 돌아오기 때문에, 
 * 좀 천천히 돌아오게 하기 위해서 MOVE_SPEED(즉, 0.1)을 곱해줘서 sprite가 좀 천천히 원래 자리로 돌아올 수 있게 해줌.
 * 이 값을 0으로 해버리면 한 번 이동한 sprite이 아예 돌아오지 않게 되고, 
 * 1로 해버리면 너무 빨리 돌아와버린다.
 */