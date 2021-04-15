import Graphics from "./sleek/Graphics";
import ImageResource from "./sleek/resources/ImageResource";

const COKEANDCODE_BG: string = "#327979";
const SPLASH_TIME: number = window.location.href.indexOf("localhost") >= 0 ? 10 : 150;
const GRAVITY: number = 0.3;
const BOUNCE: number = 0.5;

export default class SplashPage {
  onComplete: () => void;
  anim: number = 0;
  vy: number = 0;
  y: number = -100;
  image: ImageResource;

  width: number;
  height: number;

  constructor(image: ImageResource, onComplete: () => void) {
    this.image = image;
    this.onComplete = onComplete;
  
    this.width = Math.floor(Graphics.width() / 4);
    this.height = Math.floor(this.width * (image.height() / image.width()));
  }

  private complete(): void {
    this.onComplete();
  }

  update(): void {
    const floor: number = (Graphics.height() / 2) - (this.height / 2);
    this.anim++;
    this.vy += GRAVITY;
    this.y += this.vy;
    if (this.y > floor) {
      this.y = floor;
      this.vy = -this.vy * BOUNCE;
    }

    if (this.anim > SPLASH_TIME) {
      this.complete();
    }
  }

  draw(): void {
    Graphics.fillRect(0, 0, Graphics.width(), Graphics.height(), COKEANDCODE_BG)
    this.image.drawScaled(Math.floor((Graphics.width() - this.width) / 2), this.y, this.width, this.height);
  }
}