'use strict';

export class Text {
  constructor() {
    this.canvas = document.createElement('canvas');

    // this.canvas.style.position = 'absolute'; // 생성한 canvas element의 position을 absolute로 지정함.
    // this.canvas.style.left = '0';
    // this.canvas.style.top = '0'; // 해당 canvas element의 위치는 왼쪽 위에 딱붙여서 시작함.
    // document.body.appendChild(this.canvas);
    // 여기에서 만든 this.canvas에는 실제 텍스트를 렌더하지는 않을거임.
    // 여기서는 텍스트가 캔버스에 렌더된다고 가정했을 때 색깔이 칠해진 부분의 픽셀들,
    // 즉, 색상값이 있는 픽셀들의 x,y좌표값 객체가 순서대로 push된 particles 배열을 구해서 return해주려고
    // 그냥 캔버스랑 ctx만 생성해서 놓은 것. 이 ctx에서 색상값이 생길 픽셀들의 좌표값만 가져가려고

    // ripple2 만들때, tmpCtx는 DOM에 추가하지 않고 그냥 drawImage해서 각 픽셀의 색상데이터만 가져와서
    // 그거로 다양한 크기의 dot을 만들어서 ctx에만 렌더를 했었지? 그거랑 비슷한 방식인거임.
    // this.canvas에서는 픽셀들의 좌표값 데이터만 가져오고, 
    // 실제로 렌더하는 건 PIXI.Renderer로 생성한 WebGL view canvas에 렌더하는거고.

    this.ctx = this.canvas.getContext('2d');
  }

  setText(str, density, stageWidth, stageHeight) {
    this.canvas.width = stageWidth;
    this.canvas.height = stageHeight;

    const myText = str;
    const fontWidth = 700; // font의 두께로 지정하려고 할당한 값. 처음 web font를 로드할 때 Hind:700을 로드했으니까. 
    const fontSize = 800; // font의 크기를 800px로 하려는 거겠지?
    const fontName = 'Hind';

    this.ctx.clearRect(0, 0, stageWidth, stageHeight); // setText에서 캔버스 싹 한 번 지워주고 시작함.

    // ctx에 그릴 텍스트의 스타일을 지정해줌. css font 프로퍼티와 동일한 구문 사용. 
    // '폰트 두께, 폰트 사이즈, 폰트명' 순서로 할당할 것.
    this.ctx.font = `${fontWidth} ${fontSize}px ${fontName}`;
    this.ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;

    // 텍스트의 베이스라인 정렬 설정. top, hanging, middle 등을 사용 가능. 
    // 베이스라인 자체의 위치는 그대로지만, 그 베이스라인이 top이냐, hanging이냐 middle으로 정해주느냐에 따라
    // 전체 텍스트가 위 아래로 움직이면서 베이스라인 이름에 걸맞는 텍스트의 위치가 설정되는 것.
    // 즉, 베이스라인은 가만히 있고, 베이스라인의 종류를 바꿔줌에 따라 텍스트 전체만 베이스라인을 기준으로 위아래로 움직이는 거!
    this.ctx.textBaseline = `middle`;

    // measureText(text) 위에서 설정한 텍스트 및 폰트 스타일로 text를 캔버스에 렌더할 때
    // 그려질 폭, 픽셀 등을 포함하는 TextMetrics 객체를 리턴해줌.
    // 여기에는 렌더된 텍스트의 width, height, 위치값 등등의 정보가 담겨있을거임.
    const fontPos = this.ctx.measureText(myText);
    // fillText(text, x, y [, maxWidth]) 
    // 주어진 (x, y) 위치에 주어진 텍스트를 캔버스에 실제로 채움. 최대 폭(width)은 옵션 값.
    /**
     * 참고로 아래에 TextMetrics에서 가져온 값들이 각각 뭔지를 정리해보면,
     * fontPos.width는 myText가 그려질 때의 전체 폭, width값을 의미함.
     * 
     * actualBoundingBoxAscent는 위에서 textBaseline으로 설정한 'middle' 있지?
     * 이 middle textBaseline에서 텍스트 전체를 감싸는 실제 Bounding Box의 맨 윗부분까지의 거리를 리턴해 줌.
     * 
     * actualBoundingBoxDescent는 반대로 middle textBaseline에서 실제 Bounding Box의 
     * 맨 아랫부분까지의 거리를 리턴해 줌.
     * 
     * actualBoundingBoxAscen + actualBoundingBoxDescent 해주면 딱 550이 나옴.
     * 그니까 해당 text의 실제 위끝부분에서 아래끝부분 사이의 거리가 550이라는 뜻.
     * 
     * fontBoundingBoxAscent, Descent랑은 또 다른 값. 이게 보통은 거리가 더 길다.
     * 
     * x, y좌표값이 어떻게 계산되는지는
     * 실제 캔버스에 text가 그려졌을 때 아래에 있는 공식의 값들을 하나씩 없애주거나 바꿔주면서
     * 텍스트의 위치가 어떻게 바뀌는지 직접 눈으로 확인해보면서 정리하는 게 나을 거 같다.
     *  
     * MDN 텍스트 그리기 문서 참고하면서 볼 것.
     */
    this.ctx.fillText(
      myText, // 렌더할 텍스트
      (stageWidth - fontPos.width) / 2, // 여기가 x좌표값
      fontPos.actualBoundingBoxAscent +
      fontPos.actualBoundingBoxDescent +
      ((stageHeight - fontSize) / 2) // 여기까지 더한 값이 y좌표값
    );

    // 이걸 찍어보면 canvas에서 text를 렌더링할 때 기준점이 어디에 있는지 확인할 수 있음.
    /*
    this.ctx.beginPath();
    this.ctx.arc(
      (stageWidth - fontPos.width) / 2,
      fontPos.actualBoundingBoxAscent +
      fontPos.actualBoundingBoxDescent +
      ((stageHeight - fontSize) / 2),
      10, 0, Math.PI * 2, false
    );
    this.ctx.fill();
    */

    return this.dotPos(density, stageWidth, stageHeight);
    // 최종적으로 this.dotPos에서 return받은 particles 배열을 리턴해줌.
  }

  dotPos(density, stageWidth, stageHeight) {
    // imageData에는 text가 렌더된 후, 캔버스 전체에 존재하는 각 픽셀들의 색상데이터 배열이 복사되어 저장될거임.
    const imageData = this.ctx.getImageData(0, 0, stageWidth, stageHeight).data;

    const particles = [];
    let i = 0;
    let width = 0;
    let pixel;

    // height은 아마 브라우저 전체 height의 0 지점부터 끝 지점까지를 의미하는 것이고,
    // density는 뭐지? particle 하나이 width, height이 얼만큼인지를 정의해주는 값이라고 볼 수 있음.
    for (let height = 0; height < stageHeight; height += density) {
      ++i;

      // 느슨한 연산자를 사용한 비교 연산 (i % 2) == 0이 맞다면 true, 틀리다면 false를 return하여 slide에 할당.
      // 즉, i가 짝수면 true, 홀수면 false를 할당하겠지?
      // for loop의 첫번째에는 ++i로 인해 i가 1로 시작할테니 false를 할당받겠지.
      const slide = (i % 2) == 0;
      width = 0; // 일단 기본적으로는 width는 0이 할당되어있음.

      // slide는 true/false만 들어가는 boolean값.
      // 이 boolean값이 1과 비교연산이 가능하려면 '느슨한 비교 연산자(==)'를 사용할 수밖에 없다.
      // 1이라는 number는 true에 해당하므로 slide가 true라면 if block을 수행하겠지만,
      // slide가 false라면 if block을 수행하지 않는다.
      // 그런데 만약 조건문에서 '엄격한 비교 연산자(===)'를 사용한다면?
      // (slide === 1)이 true가 되려면 slide는 true여야 할 뿐만 아니라, slide의 값 자체도 1이어야만 한다.
      // 그런데 slide는 항상 boolean값이므로, if block은 항상 실행되지 않게 된다.
      // 사실 느슨한 비교 연산자의 사용을 지양할 것을 권하고 있지만, 
      // 이런 경우에는 엄격 연산자보다 느슨한 연산자가 필요하다고도 볼 수 있다.
      if (slide == 1) {
        width += 6;
      }
      // 어쨋든 결론적으로 i가 짝수면 width에 6을 더해주고, 홀수면 더해주지 않음.
      // i가 짝수면 width는 6, 홀수면 0이라는 거.
      // 예를 들어 첫번째 for loop에는 slide가 false이므로 width에 6을 더해주지 않으니 0이지? 
      // 여기까지 계속 for loop를 돌려보면 width는 0과 6이 번갈아 나오게 될것이고,
      // density의 값에 따라, stageHeight이 몇으로 리사이징 됬는지에 따라 for loop를 도는 횟수가 달라짐.
      // 일단 지금 왜 width에 6을 더해주는지 모르겠는데 나중에 비슷한 경우가 또 나온다면 다시 알아보자ㅠ

      // 이중 for loop. width에 대해서 density만큼을 계속 더해주면서 반복하네...
      // 여기서의 densitiy도 particle 하나의 width를 몇 정도로 할 것인지 정해주는거임.(여기서는 2를 전달받았지?)
      // i가 짝수면 width는 6에서 시작하고, 홀수면 0에서 for loop를 시작함.
      for (width; width < stageWidth; width += density) {
        // 이거는 예전에 해봤다.
        // pixel에다가 height - 1 까지의 row에 존재하는 전체 픽셀 개수를 구하고, (참고로 이 값은 height * stageWidth와 동일함.)
        // height에 해당하는 row에서 width만큼의 픽셀 개수를 더한 값. 
        // 즉 해당 픽셀이 캔버스의 전체 픽셀 중에서 몇 번째 픽셀인지 세어준 것.
        // 그 값에 4를 곱해서 imageData[index]에서 저 index에 넣어버리면, 
        // 해당 번째 픽셀 뒤에 있는 다음 픽셀의 rgba 중 r값의 색상데이터를 return해줄거임.
        // 그런데 거기서 -1을 하면, 해당 번째 픽셀의 rgba중 a값
        // 즉 해당 픽셀의 alpha(투명도)값이 pixel에 할당됨.

        // 참고로, getImageData로 가져온 ImageData 배열 상에서는 alpha값도 0-255 사이의 숫자로 표현됨.
        // 아래의 if block 안에서 투명도가 0이 아닌 애들만 pixel에 할당된 값을 찍어보면, 대부분 77이 나오는데
        // 이 값은 결국 77 / 255 = 약 0.3 이 나온다. 이거는 위에서 텍스트를 ctx에 그리기 전 fillStyle로 지정한 rgba(0, 0, 0, 0.3)에서
        // alpha값인 0.3과 같지? 
        pixel = imageData[((width + (height * stageWidth)) * 4) - 1];

        if (pixel != 0 &&
          width > 0 &&
          width < stageWidth &&
          height > 0 &&
          height < stageHeight) {
          // 해당 픽셀의 위치가 브라우저 내에 존재하고, 
          // 해당 픽셀의 alpha값이 0이 아니라면(즉 투명도가 0이 아니라면, 색상이 존재하고)
          // if block을 수행해서 해당 픽셀의 x, y좌표값 객체를 만들어서 particles에 push해줌.
          particles.push({
            x: width,
            y: height,
          });
        }
      }
    }

    // 이중 for loop를 돌면서 캔버스에 그려진 particle들을 모두 확인해보고,
    // 해당 particle의 픽셀에 색상이 존재하고, 픽셀의 위치값이 브라우저 내에 위치하는 애들의
    // x, y좌표값 객체가 담긴 particles 배열을 return함.
    return particles;
  }
}