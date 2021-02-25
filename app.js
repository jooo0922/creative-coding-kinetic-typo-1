'use strict';

/*
import {
  Text
} from './text.js'
*/

import {
  Visual
} from './visual.js';

class App {
  constructor() {
    this.setWebgl();

    // Web Font Loader library의 url을 해당 html 페이지에 포함시킨 뒤, 
    // 연결된 js 파일에서 어떤 font를 load하고 싶은지 써주면 됨.
    // Google Fonts, Typekit, Fonts.com, and Fontdeck 에서 폰트를 로드할 수 있음.
    // 이때 만약 Google Fonts에 있는 font를 로드하려면 google: 이라고 아래처럼 써줘야 함.
    WebFont.load({
      google: {
        families: ['Hind:700']
      },
      // webfontloader 깃허브 readMe 문서에 정의된 events 중 하나. 
      // fontactive는 렌더링하는 각 폰트에 대해서 한번씩만 트리거되면서 해당 콜백함수를 실행함.
      fontactive: () => {
        /*
        이 부분은 text.js에서 생성한 텍스트가 어떻게 들어가는지 보여주려고
        테스트삼아 작성한 코드. 이제 얘내들을 PIXI.Renderer로 생성한 WebGL view에다가 그려줄거임.

        this.text = new Text();
        this.text.setText(
          'A',
          2,
          document.body.clientWidth,
          document.body.clientHeight,
        );
        */

        this.visual = new Visual();

        window.addEventListener('resize', this.resize.bind(this), false);
        this.resize();

        requestAnimationFrame(this.animate.bind(this));
      }
    });
  }

  setWebgl() {
    /**
     * PIXI.Renderer
     * 
     * 얘는 pixi basic 공부할 때 한번도 안써본 메소드임.
     * 얘는 뭐냐면 scene과 scene 내부의 content들을 WebGL 사용이 가능한 캔버스 안에 그려내는 메소드임.
     * 
     * 그래서 WebGL을 지원하는 브라우저에서만 사용되어야 하고,
     * view를 DOM에 추가해야만 화면에 실제로 보일 수 있다.
     * (참고로 WebGL을 지원하지 않는 브라우저에서 사용해야 할 경우 PIXI.CanvasRenderer를 사용해야 함.)
     * 
     * Renderer는 특정한 작업들을 관리하는 system들로 구성되어 있다.
     * 각 시스템 이름과 설명에 대해서는 PixiJS 공식문서
     * https://pixijs.download/release/docs/PIXI.Renderer.html
     * 를 참고할 것.
     * 
     * 또한 new PIXI.Renderer에 객체 파라미터로써 전달되는 여러가지 options list가 있으므로
     * 이것도 공식문서에서 참고할 것. 
     * 
     * 원래 pixi basic에서는 항상 new PIXI.Application 으로 생성해서 만들었잖아?
     * 이거는 renderer, root container(여기서 지금 this.stage에 담겨있는 거), ticker들을 한번에 생성해주는 거임.
     * 이걸 쓰는 게 더 편하지만, 여기서는 일단
     * renderer, container를 따로따로 생성해놓음.
     */
    this.renderer = new PIXI.Renderer({
      width: document.body.clientWidth,
      height: document.body.clientHeight,
      antialias: true,
      transparent: false,
      resolution: (window.devicePixelRatio > 1) ? 2 : 1,
      autoDensity: true, // resolution이 1이 아닌 경우 CSS pixel의 renderer view 사이즈를 조정해 줌. -> 캔버스로 치면 this.ctx.scale(resolution, resolution)이라고 보면 됨.
      powerPreference: "high-performance", // "high-performance" 로 값을 전달하면 듀얼 그래픽카드를 사용하는 장치를 지원할 수 있게 해줌.
      backgroundColor: 0xff4338, // PIXI.Renderer로 생성할 WebGL view의 배경색을 설정해주는 거.
    });
    document.body.appendChild(this.renderer.view);

    /**
     * PIXI.Container
     * 
     * 컨테이너는 여러 child들을 담는 범용 디스플레이 객체를 의미함.
     * 그래픽, sprite 등 다른 객체의 컨테이너 역할도 하는 모든 디스플레이 객체의 기본 클래스라고 보면 됨.
     * 
     * 자신이 담고있는 디스플레이 객체들에 대해 
     * 마스킹, 필터링과 같은 고급 렌더링을 적용해주는 기능을 기본적으로 지원함. 
     * 
     * 지금 여기서는 어쨋거나 디스플레이 객체들을 담을 수 있는 '컨테이너가 생성만' 된 것.
     * 이제 여기에다가 sprite이나 그래픽 같은 것들을 생성해서 addChild로 담을 수 있는거임.
     * 
     * 원래는 항상 this.app = new PIXI.Application(); 이렇게 생성하면 stage라는 이름의 root container도 자동 생성되서
     * this.app.stage.addChild(sprite) 이렇게 하면 알아서 WebGL view에 렌더가 되었는데
     * 여기서는 그 과정들을 모두 세분화해서 보여줌.
     */
    this.stage = new PIXI.Container();

    /**
     * PIXI.filters.BlurFilter
     * 
     * object에 Gaussian Blur(가우스 블러 효과)를 적용함.
     * blur의 강도는 x축과 y축에 대해 별도로 설정 가능.
     */
    const blurFilter = new PIXI.filters.BlurFilter();
    blurFilter.blur = 10; // blur의 강도를 x축과 y축 모두에 10으로 설정함.
    blurFilter.autoFit = true;
    // autoFit은 PIXI.Filter class로부터 상속된 Inherited Properties 중 하나로,
    // true를 할당하여 활성화할 경우 PixiJS는 더 나은 성능을 위해 필터 영역을 경계에 맞춥니다. 
    // 특정 셰이더에 대해 작동하지 않는 경우 끕니다.

    // 이게 뭐냐면, PIXI.Filter에 들어갈 fragment shader의 소스코드를 string으로 할당한거 같은데
    // 공식문서에서 PIXI.Filter에 대해 좀 더 공부해봐야겠음.
    const fragsource = `
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float threshold;
      uniform float mr;
      uniform float mg;
      uniform float mb;
      void main(void) {
        vec4 color = texture2D(uSampler, vTextureCoord);
        vec3 mcolor = vec3(mr, mg, mb);
        if (color.a > threshold) {
          gl_FragColor = vec4(mcolor, 1.0);
        } else {
          gl_FragColor = vec4(vec3(0.0), 0.0);
        }
      }
    `;

    const uniformsData = {
      threshold: 0.5,
      mr: 244.0 / 255.0,
      mg: 193.0 / 255.0,
      mb: 41.0 / 255.0,
      // 여기의 mr, mg, mb값을 수정해서 WebGL view에 렌더되는 
      // container 내부 디스플레이 객체(sprite)들의 색상값을 바꿔줄 수 있는거 같음.
    };

    const thresholdFilter = new PIXI.Filter(null, fragsource, uniformsData);
    this.stage.filters = [blurFilter, thresholdFilter];
    this.stage.filterArea = this.renderer.screen;
    // 여기까지가 뭘 한거냐면,
    // 원래는 그냥 검정색 원 모양의 sprite들이 pointermove를 따라 움직이면서 텍스트가 변형이 되는데,
    // 그러다보니까 너무 자글자글한 원들이 대놓고 보여서 경계선이 부드럽게 렌더된다는 느낌이 안드는거임.
    // 그래서 blurFilter와 thresholdFilter의 두 가지 필터효과를 생성해서
    // WebGl view에 매 프레임마다 렌더되고 있는 this.stage라는 root container에 적용시켜 준 것 같음.
    // 필터를 만드는 방법이나 특히 PIXI.Filter 내부의 parameter들이 뭘 뜻하는건지 잘 이해가 안감.
    // 내일 복습할 때 좀 더 검색해서 찾아볼 것. 
  }

  resize() {
    this.stageWidth = document.body.clientWidth;
    this.stageHeight = document.body.clientHeight;

    // PIXI.Renderer의 메소드인 resize는 
    // WebGL view를 파라미터로 전달받은 width, height만큼 resize함.
    this.renderer.resize(this.stageWidth, this.stageHeight);

    this.visual.show(this.stageWidth, this.stageHeight, this.stage);
  }

  animate(t) {
    requestAnimationFrame(this.animate.bind(this)); // 내부에서 스스로 호출해서 반복할 수 있도록.

    this.visual.animate();

    // PIXI.Renderer의 메소드인 render는
    // PIXI.Renderer로 생성하여 DOM에 추가한 WebGL view에다가 파라미터로 전달한 root container(this.stage)를 렌더해줌. 
    // 그니까 this.stage라는 여러 디스플레이 객체를 담고있는 컨테이너를 WebGL view에 렌더해준 것.
    // 매 프레임마다 root container를 새롭게 렌더해주는 것.
    this.renderer.render(this.stage);
  }
}

window.onload = () => {
  new App();
};