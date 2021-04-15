import Game from "./sleek/Game";
import Graphics, { WHITE, BLACK, GREEN, SHADE } from "./sleek/Graphics";
import { ZIP } from "./sleek/resources/Resources";
import SplashPage from "./SplashPage";
import { CC_LOGO, MIRROR, SPRITES } from "./MirrorResource";
import TiledMap from "./sleek/tiled/TiledMap";
import { DOWN_KEY, LEFT_KEY, RIGHT_KEY, SPACE_KEY, UP_KEY } from "./sleek/util/Keys";
import { threadId } from "node:worker_threads";

const SKY: string = "#48979c";

const FLOOR: number = 0;
const OBJECTS: number = 1;
const TOPS: number = 2;

const FRAMES: number[] = [0, 1, 0, 2];
const COLLECT: number[] = [12];

class Pos {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export default class MirrorGame extends Game {
  resourcesLoaded: boolean = false;
  counter: number = 0;
  atSplashPage: boolean = true;
  splashPage: SplashPage;
  level: TiledMap;

  player: Pos;
  mirrorPlayer: Pos;

  up: boolean = false;
  down: boolean = false;
  left: boolean = false;
  right: boolean = false;

  facingDown: boolean = false;
  moving: boolean = false;
  flipped: boolean = false;

  dead: boolean = false;
  deadTimer: number = 0;

  win: boolean = false;
  winTimer: number = 0;

  leftMove: number = 0;
  rightMove: number = 0;
  downMove: number = 0;
  upMove: number = 0;

  constructor() {
    super();
  }

  keyUp(key: string): void {
    if (!this.atSplashPage) {
      if (key === UP_KEY) {
        this.up = false;
      }
      if (key === DOWN_KEY) {
        this.down = false;
      }
      if (key === LEFT_KEY) {
        this.left = false;
      }
      if (key === RIGHT_KEY) {
        this.right = false;
      }
    }
  }

  keyDown(key: string): void {
    if (!this.atSplashPage) {
      if (key === SPACE_KEY) {
        if ((this.upMove === 0) && (this.downMove === 0) && (this.leftMove === 0) && (this.rightMove === 0)) {
          this.switch();
        }
      }
      if (key === UP_KEY) {
        this.up = true;
        this.facingDown = false;
      }
      if (key === DOWN_KEY) {
        this.down = true;
        this.facingDown = true;
      }
      if (key === LEFT_KEY) {
        this.left = true;
        this.flipped = true;
      }
      if (key === RIGHT_KEY) {
        this.right = true;
        this.flipped = false;
      }
    }
  }

  switch(): void {
    const px: number = this.player.x;
    const py: number = this.player.y;
    const mx: number = this.mirrorPlayer.x;
    const my: number = this.mirrorPlayer.y;

    const mid: number = 80;

    this.player = new Pos(mx, (mid - my) + mid);
    this.mirrorPlayer = new Pos(px, mid - (py - mid));
  }

  onResourcesLoaded(): void {
    console.log("Resources loaded");
    this.resourcesLoaded = true;
    this.splashPage = new SplashPage(CC_LOGO, () => {
      this.atSplashPage = false;
    })
    this.atSplashPage = true;

    this.loadLevel("test");
  }

  loadLevel(name: string): void {
    const mapData: any = JSON.parse(JSON.stringify(ZIP.getJson("maps/" + name + ".json")));
    this.level = new TiledMap(mapData);

    for (let x = 0; x < this.level.width; x++) {
      for (let y = 0; y < this.level.height; y++) {
        if (this.level.get(OBJECTS, x, y) === 21) {
          // starting position for our wizard
          this.level.set(OBJECTS, x, y, 0);
          this.player = new Pos(x * 10, y * 8);
          this.mirrorPlayer = new Pos(x * 10, (10 - (y - 10)) * 8);
        }
      }
    }

    this.level.setLayerRenderOffset(TOPS, 0, -1);
    this.dead = false;
    this.win = false;
  }

  die(): void {
    this.dead = true;
    this.deadTimer = 0;
  }

  updateGame(): void {
    this.moving = false;

    if (this.dead) {
      this.deadTimer++;
      if (this.deadTimer > 150) {
        this.loadLevel("test");
      }
      return;
    }
    if (this.win) {
      this.winTimer++;
      if (this.winTimer > 180) {
        this.loadLevel("test");
      }
      return;
    }
    if ((this.upMove === 0) && (this.downMove === 0) && (this.leftMove === 0) && (this.rightMove === 0)) {
      if (this.down) {
        this.downMove = 8;
      } else if (this.up) {
        this.upMove = 8;
      } else if (this.left) {
        this.leftMove = 10;
      } else if (this.right) {
        this.rightMove = 10;
      }
    }
    
    if (this.downMove > 0) {
      this.downMove--;
      let blocked: boolean = false;
      let mirrorBlocked: boolean = false;
      for (let i=0;i<10;i++) {
        if (this.blocked(Math.floor((this.mirrorPlayer.x + i) / 10), Math.floor(this.mirrorPlayer.y / 8))) {
          mirrorBlocked = true;
        }
        if (this.blocked(Math.floor((this.player.x + i) / 10) , Math.floor((this.player.y + 8) / 8))) {
          blocked = true;
        }
      }
      if (!mirrorBlocked) {
        this.mirrorPlayer.y--;
      }
      if (!blocked) {
        this.player.y++;
      }
      this.moving = true;
    }
    if (this.upMove > 0) {
      this.upMove--;
      let blocked: boolean = false;
      let mirrorBlocked: boolean = false;
      for (let i=0;i<10;i++) {
        if (this.blocked(Math.floor((this.mirrorPlayer.x + i) / 10), Math.floor((this.mirrorPlayer.y + 8) / 8))) {
          mirrorBlocked = true;
        }
        if (this.blocked(Math.floor((this.player.x + i) / 10), Math.floor(this.player.y / 8))) {
          blocked = true;
        }
      }
      if (!mirrorBlocked) {
        this.mirrorPlayer.y++;
      }
      if (!blocked) {
        this.player.y--;
      }
      this.moving = true;
    }
    if (this.leftMove > 0) {
      this.leftMove--;
      let blocked: boolean = false;
      let mirrorBlocked: boolean = false;
      for (let i=0;i<4;i++) {
        if (this.blocked(Math.floor((this.mirrorPlayer.x - 1) / 10), Math.floor((this.mirrorPlayer.y + 4 + i) / 8))) {
          mirrorBlocked = true;
        }
        if (this.blocked(Math.floor((this.player.x - 1) / 10), Math.floor((this.player.y + 1 + i) / 8))) {
          blocked = true;
        }
      }
      if (!mirrorBlocked) {
        this.mirrorPlayer.x--;
      }
      if (!blocked) {
        this.player.x--;
      }
      this.moving = true;
    }
    if (this.rightMove > 0) {
      this.rightMove--;
      let blocked: boolean = false;
      let mirrorBlocked: boolean = false;
      for (let i=0;i<4;i++) {
        if (this.blocked(Math.floor((this.mirrorPlayer.x + 10) / 10), Math.floor((this.mirrorPlayer.y + 4 + i) / 8))) {
          mirrorBlocked = true;
        }
        if (this.blocked(Math.floor((this.player.x + 10) / 10), Math.floor((this.player.y + 1 + i) / 8))) {
          blocked = true;
        }
      }
      if (!mirrorBlocked) {
        this.mirrorPlayer.x++;
      }
      if (!blocked) {
        this.player.x++;
      }
      this.moving = true;
    }

    for (let x=4;x<9;x++) {
      for (let y=4;y<7;y++) {
        this.activate(Math.floor((this.player.x+x) / 10), Math.floor((this.player.y+y) / 8));
      }
    }
  }

  activate(x: number, y: number): void {
    const obj: number = this.level.get(OBJECTS, x, y);
    if (COLLECT.indexOf(obj) >= 0) {
      this.collect(obj);
      this.level.set(OBJECTS, x, y, 0);
    }

    const floor: number = this.level.get(FLOOR, x, y);
    if (floor === 4) {
      // spikes
      this.die();
    }
  }

  collect(obj: number): void {
    if (obj === 12) {
      // got the gem
      this.win = true;
      this.winTimer = 0;
    }
  }

  blocked(x: number, y: number): boolean {
    if ((x < 0) || (y < 0) || (x >= this.level.width) || (y >= this.level.height)) {
      return true;
    }
    if (this.level.get(FLOOR, x, y) === 0) {
      return true;
    }

    const obj: number = this.level.get(OBJECTS, x, y);
    return (obj != 0) && (COLLECT.indexOf(obj) < 0);
  }

  drawGame(): void {
    let frame = 0;
    if (this.moving) {
      frame = FRAMES[Math.floor(this.counter / 5) % FRAMES.length];
    }

    Graphics.push();
    Graphics.translate(Math.floor((Graphics.width() / 2) - 40), 0);
    let drawnMirrorPlayer: boolean = false;
    this.level.drawRows(SPRITES, 0, 0, 0, -2, 0, 1, 8, 9, (row: number, layer: number) => {
      if (!drawnMirrorPlayer && !this.dead) {
        if (layer === FLOOR) {
          if (row === Math.floor((this.mirrorPlayer.y + 4) / 8)) {
            drawnMirrorPlayer = true;

            if (this.flipped) {
              Graphics.push();
              Graphics.scale(-1, 1);
              SPRITES.draw(-this.mirrorPlayer.x - 12, this.mirrorPlayer.y - 4, (this.facingDown ? 30 : 20) + frame);
              Graphics.pop();
            } else {
              SPRITES.draw(this.mirrorPlayer.x, this.mirrorPlayer.y - 4, (this.facingDown ? 30 : 20) + frame);
            }
          }
        }
      }
    });

    if (this.dead) {
      Graphics.setAlpha(0.5);
      SPRITES.draw(this.mirrorPlayer.x, this.mirrorPlayer.y - 4 - (this.deadTimer), 10);
      Graphics.setAlpha(1);
    }

    MIRROR.draw(-20, 0);
    let drawnPlayer: boolean = false;
    this.level.drawRows(SPRITES, 0, 0, 0, -2, 0, 10, 8, 9, (row: number, layer: number) => {
      if (!drawnPlayer && !this.dead) {
        if (layer === FLOOR) {
          if (row === Math.floor((this.player.y + 4) / 8)) {
            drawnPlayer = true;
            if (this.flipped) {
              Graphics.push();
              Graphics.scale(-1, 1);
              SPRITES.draw(-this.player.x - 12, this.player.y - 4, (this.facingDown ? 20 : 30) + frame);
              Graphics.pop();
            } else {
              SPRITES.draw(this.player.x, this.player.y - 4, (this.facingDown ? 20 : 30) + frame);
            }
          }
        }
      }
    });

    if (this.dead) {
      Graphics.setAlpha(0.5);
      SPRITES.draw(this.player.x, this.player.y - 4 - (this.deadTimer), 10);
      Graphics.setAlpha(1);
    }

    Graphics.pop();

    if (this.dead) {
      Graphics.fillRect(0, (Graphics.height() / 2) - 4, Graphics.width(), 7, SHADE);
      Graphics.center("YOU DIED", (Graphics.height() / 2) - 3);
    }
    if (this.win) {
      Graphics.fillRect(0, (Graphics.height() / 2) - 4, Graphics.width(), 7, SHADE);
      Graphics.center("YOU GOT THE MIRROR GEM!", (Graphics.height() / 2) - 3);
    }
  }

  update(): void {
    Graphics.maintainAspectRatio(1);

    this.counter++;
    Graphics.fillRect(0, 0, Graphics.width(), Graphics.height(), SKY);

    if (this.resourcesLoaded) {
      if (this.atSplashPage) {
        this.splashPage.update();
        this.splashPage.draw();
      } else {
        this.updateGame();
        this.drawGame();
      }
    } else {
      Graphics.ctx.fillStyle = "#fff";
      Graphics.ctx.textAlign = "center";
      Graphics.fillRect(20, Math.floor(Graphics.height() / 2) - 12, Graphics.width() - 40, 24, WHITE);
      Graphics.fillRect(24, Math.floor(Graphics.height() / 2) - 8, Graphics.width() - 48, 16, BLACK);
      if (ZIP.getSize()) {
        const prop: number = (ZIP.getReceived() / ZIP.getSize());
        const oneprop: number = 1 - prop;
        const progress: number = Math.floor(prop * (Graphics.width() - 56));

        const r: number = Math.floor(oneprop * 0xd2) + Math.floor(prop * 0x6b);
        const g: number = Math.floor(oneprop * 0x1b) + Math.floor(prop * 0x8b);
        const b: number = Math.floor(oneprop * 0x1b) + Math.floor(prop * 0x1d);
        const col: string = "#" + r.toString(16) + g.toString(16) + b.toString(16);
        Graphics.fillRect(28, Math.floor(Graphics.height() / 2) - 4, progress, 8, col);
      } else {
        Graphics.fillRect(28, Math.floor(Graphics.height() / 2) - 4, Graphics.width() - 56, 8, GREEN);
      }
    }
  }
}