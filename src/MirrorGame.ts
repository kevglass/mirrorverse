import Game from "./sleek/Game";
import Graphics, { WHITE, BLACK, GREEN, SHADE, GREY } from "./sleek/Graphics";
import { ZIP } from "./sleek/resources/Resources";
import SplashPage from "./SplashPage";
import { CC_LOGO, CLICK_SOUND, DIE_SOUND, FAIL_SOUND, MIRROR, MUSIC, SLIDE_SOUND, SPRITES, STEP_SOUND, SWITCH_SOUND, TITLE, WIN_SOUND } from "./MirrorResource";
import TiledMap, { TiledMapLayer } from "./sleek/tiled/TiledMap";
import { DOWN_KEY, ENTER_KEY, ESCAPE_KEY, LEFT_KEY, RIGHT_KEY, SPACE_KEY, UP_KEY } from "./sleek/util/Keys";
import Settings from "./sleek/Settings";
import { allowedNodeEnvironmentFlags } from "node:process";
import { TiledMapRenderer } from "./sleek/tiled/TiledMapRenderer";

const SKY: string = "#48979c";

const FLOOR: number = 0;
const OBJECTS: number = 1;
const TOPS: number = 2;

const FRAMES: number[] = [0, 1, 0, 2];
const COLLECT: number[] = [12];
const FALL_THROUGH: number[] = [0, 6, 16, 26];

const BOX: number = 24;
const GEM: number = 12;
const SPIKES: number = 4;
const BLUE_SWITCH: number = 5;
const RED_SWITCH: number = 15;
const GREEN_SWITCH: number = 25;

class LevelData {
  file: string;
  name: string;
}

const LEVELS: LevelData[] = [
  { file: "easy", name: "SWITCHOROO" },
  { file: "level1", name: "SPIKEY FALLS" },
  { file: "level2", name: "TROUBLED WATERS" },
  { file: "level3", name: "BLUE HERRING" },
  { file: "level4", name: "AMAZING" },
  { file: null, name: "CUSTOM LEVEL" }
];

const dev: boolean = false; //location.href.indexOf("localhost") >= 0;

const RED_SHADE: string = "rgba(255,0,0,0.5)";
const GREEN_SHADE: string = "rgba(0,255,0,0.5)";

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
  atTitle: boolean = true;
  level: TiledMap;
  renderer: TiledMapRenderer;

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

  currentLevel: number = 0;

  fadeOut: boolean = false;
  fadeMid: () => void;
  fadeDone: () => void;
  fadeIn: boolean = false;
  fadeAlpha: number = 1;

  atLevelSelect: boolean = false;
  levelStarting: number = 0;
  death: string = "";
  
  constructor() {
    super();

    document.getElementById("fileupload").addEventListener("change", () => {
      const selectedFile = (<HTMLInputElement> document.getElementById('fileupload')).files[0];
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = () => {
          if (this.loadLevelFromText(<string> reader.result)) {
            this.levelStarting = 60;
            this.atLevelSelect = false;
            console.log("Loaded Successfully");
          }
        }
        reader.readAsText(selectedFile);
      }
    }, false);
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
      if (this.atTitle) {
        if (key === SPACE_KEY) {
          this.atTitle = false;
          this.atLevelSelect = true;
          CLICK_SOUND.play();
        }
      } else if (this.atLevelSelect) {
        if (key === UP_KEY) {
          this.currentLevel--;
          if (this.currentLevel < 0) {
            this.currentLevel = LEVELS.length - 1;
          }
          SLIDE_SOUND.play();
        }
        if (key === DOWN_KEY) {
          this.currentLevel++;
          if (this.currentLevel >= LEVELS.length) {
            this.currentLevel = 0;
          }
          SLIDE_SOUND.play();
        }
        if ((key === SPACE_KEY) || (key === ENTER_KEY)) {
          if (LEVELS[this.currentLevel].file === null) {
            (<HTMLInputElement> document.getElementById("fileupload")).value = null;
            document.getElementById("fileupload").click();
          } else {
            this.loadLevel();
            this.levelStarting = 60;
            this.atLevelSelect = false;
          }
          CLICK_SOUND.play();
        }
        if (key === ESCAPE_KEY) {
          this.atTitle = true;
          FAIL_SOUND.play();
        }
      } else {
        if (key === ESCAPE_KEY) {
          this.atTitle = true;
          FAIL_SOUND.play();
        }
        if (key === SPACE_KEY) {
          if ((!this.dead) && (!this.win)) {
            if ((this.upMove === 0) && (this.downMove === 0) && (this.leftMove === 0) && (this.rightMove === 0)) {
              this.switch();
            }
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
  }

  switch(): void {
    SWITCH_SOUND.play();

    this.fadeMid = () => {
      const px: number = this.player.x;
      const py: number = this.player.y;
      const mx: number = this.mirrorPlayer.x;
      const my: number = this.mirrorPlayer.y;
  
      const mid: number = 80;
  
      this.player = new Pos(mx, (mid - my) + mid);
      this.mirrorPlayer = new Pos(px, mid - (py - mid));
    };
    this.fadeDone = () => {
      let px: number = Math.floor((this.player.x) / 10);
      let py: number = Math.floor((this.player.y + 4)/ 8);
      let mx: number = Math.floor(this.mirrorPlayer.x / 10);
      let my: number = Math.floor(this.mirrorPlayer.y / 8);
      
      this.updateSwitches();

      if ((this.level.get(OBJECTS, px, py) !== 0) || (this.level.get(OBJECTS, mx, my) !== 0)) {
        this.switch();
      } else if ((this.fallAt(px, py)) || (this.fallAt(mx, my))) {
        this.switch();
      }
    }
    this.fadeOut = true;
  }

  onResourcesLoaded(): void {
    console.log("Resources loaded");
    this.resourcesLoaded = true;
    this.splashPage = new SplashPage(CC_LOGO, () => {
      this.atSplashPage = false;
    })
    this.atSplashPage = true;


    MUSIC.play(0.5);
    this.loadLevel();
  }

  loadLevel(): void {
    const name: string = dev ? "test" : LEVELS[this.currentLevel].file;
    if (!name) {
      this.atTitle = true;
      return;
    }
    const mapData: any = JSON.parse(JSON.stringify(ZIP.getJson("maps/" + name + ".json")));
    this.level = new TiledMap(mapData);
    this.renderer = new TiledMapRenderer(this.level);

    this.postProcessLevel();
  }

  loadLevelFromText(text: string): boolean {
    this.level = new TiledMap(null);
    this.renderer = new TiledMapRenderer(this.level);

    const floorData: number[] = [];
    const objData: number[] = [];
    const topData: number[] = [];

    for (let y=0;y<19;y++) {
      for (let x=0;x<8;x++) {
        floorData.push(0);
        objData.push(0);
        topData.push(0);
      }
    }
    const lines: string[] = text.split("\n");
    if (lines.length != 17) {
      alert("Format Error: Wrong number of lines - should be 17: " + lines.length);
      return false;
    }
    for (let y=0;y<lines.length;y++) {
      const line: string = lines[y];
      if (y === 8) {
        continue;
      }
      if (line.length != 8) {
        alert("Format Error: One of the lines isn't 8 characters");
        return false;
      }

      for (let x=0;x<line.length;x++) {
        const c: string = line.substring(x, x+1);
        const ty: number = y + 2;
        const target: number = x + (ty * 8);
        let floorRequired: boolean = false;

        if (c === "0") {
          floorRequired = true;
        }
        if (c === "S") {
          objData[target] = 21;
          floorRequired = true;
        }
        if (c === "M") {
          objData[target] = 12;
          floorRequired = true;
        }
        if (c === "P") {
          objData[target] = 13;
          topData[target - 8] = 3;
          floorRequired = true;
        }
        if (c === "s") {
          floorData[target] = 4;
        }
        if (c === "X") {
          objData[target] = 24;
          floorRequired = true;
        }
        if (c === "B") {
          floorData[target] = 5;
        }
        if (c === "b") {
          floorData[target] = 6;
        }
        if (c === "R") {
          floorData[target] = 15;
        }
        if (c === "r") {
          floorData[target] = 16;
        }
        if (c === "G") {
          floorData[target] = 25;
        }
        if (c === "g") {
          floorData[target] = 26;
        }

        if (floorRequired) {
          const tile: number = 1 + ((x + y) % 2);
          floorData[target] = tile;
        }
      }
    }
    const floor: TiledMapLayer = new TiledMapLayer("floor", 8, 19, floorData);
    const objects: TiledMapLayer = new TiledMapLayer("floor", 8, 19, objData);
    const tops: TiledMapLayer = new TiledMapLayer("floor", 8, 19, topData);
    this.level.addLayer(floor);
    this.level.addLayer(objects);
    this.level.addLayer(tops);
    this.level.width = 8;
    this.level.height = 19;
    this.level.tileWidth = 10;
    this.level.tileHeight = 10;
    
    this.postProcessLevel();

    console.log("COMPLETE CUSTOME LEVEL LOAD");

    return true;
  }

  private postProcessLevel(): void {
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
    this.leftMove = 0;
    this.rightMove = 0;
    this.upMove = 0;
    this.downMove = 0;
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
  }

  die(reason: string): void {
    DIE_SOUND.play();
    this.death = reason;
    this.dead = true;
    this.deadTimer = 0;
  }

  isAt(pos: Pos, x: number, y: number): boolean {
    const xp: number = Math.floor(pos.x / 10);
    const yp: number = Math.floor((pos.y + 4) / 8);

    return (x === xp) && (y === yp);
  }

  updateSwitches(): void {
    let blueOn: boolean = false;
    let redOn: boolean = false;
    let greenOn: boolean = false;

    for (let x: number = 0; x < this.level.width; x++) {
      for (let y: number = 0; y < this.level.height; y++) {
        const floor: number = this.level.get(FLOOR, x, y);
        const obj: number = this.level.get(OBJECTS, x, y);
        if (floor === BLUE_SWITCH) {
          if (this.isAt(this.player, x, y)) {
            blueOn = true;
          }
          if (this.isAt(this.mirrorPlayer, x, y)) {
            blueOn = true;
          }
          if (obj !== 0) {
            blueOn = true;
          }
        }
        if (floor === RED_SWITCH) {
          if (this.isAt(this.player, x, y)) {
            redOn = true;
          }
          if (this.isAt(this.mirrorPlayer, x, y)) {
            redOn = true;
          }
          if (obj !== 0) {
            redOn = true;
          }
        }
        if (floor === GREEN_SWITCH) {
          if (this.isAt(this.player, x, y)) {
            greenOn = true;
          }
          if (this.isAt(this.mirrorPlayer, x, y)) {
            greenOn = true;
          }
          if (obj !== 0) {
            greenOn = true;
          }
        }
      }
    }


    for (let x: number = 0; x < this.level.width; x++) {
      for (let y: number = 0; y < this.level.height; y++) {
        const floor: number = this.level.get(FLOOR, x, y);
        if ((floor == BLUE_SWITCH + 1) && (blueOn)) {
          this.level.set(FLOOR, x, y, BLUE_SWITCH + 2);
        }
        if ((floor == RED_SWITCH + 1) && (redOn)) {
          this.level.set(FLOOR, x, y, RED_SWITCH + 2);
        }
        if ((floor == GREEN_SWITCH + 1) && (greenOn)) {
          this.level.set(FLOOR, x, y, GREEN_SWITCH + 2);
        }
        if ((floor == BLUE_SWITCH + 2) && (!blueOn)) {
          this.level.set(FLOOR, x, y, BLUE_SWITCH + 1);
        }
        if ((floor == RED_SWITCH + 2) && (!redOn)) {
          this.level.set(FLOOR, x, y, RED_SWITCH + 1);
        }
        if ((floor == GREEN_SWITCH + 2) && (!greenOn)) {
          this.level.set(FLOOR, x, y, GREEN_SWITCH + 1);
        }
      }
    }

    const px: number = Math.floor(this.player.x / 10);
    const py: number = Math.floor((this.player.y + 4) / 8);
    const mx: number = Math.floor(this.mirrorPlayer.x  / 10);
    const my: number = Math.floor((this.mirrorPlayer.y + 4) / 8);
    if (FALL_THROUGH.indexOf(this.level.get(FLOOR, px, py)) >= 0) {
      this.die("You fell off the world");
    }
    if (FALL_THROUGH.indexOf(this.level.get(FLOOR, mx, my)) >= 0) {
      this.die("You fell off the world");
    }
  }

  updateGame(): void {
    this.moving = false;

    if (this.levelStarting > 0) {
      this.levelStarting--;
      return;
    }

    if (this.fadeOut) {
      this.fadeAlpha -= 0.05;
      if (this.fadeAlpha < 0) {
        this.fadeAlpha = 0;
        this.fadeOut = false;
        this.fadeMid();
        this.fadeIn = true;
      }
      return;
    }
    if (this.fadeIn) {
      this.fadeAlpha += 0.05;
      if (this.fadeAlpha > 1) {
        this.fadeAlpha = 1;
        this.fadeIn = false;
        this.fadeDone();
      }
    }

    if (this.dead) {
      this.deadTimer++;
      if (this.deadTimer > 150) {
        this.loadLevel();
      }
      return;
    }
    if (this.win) {
      this.winTimer++;
      if (this.winTimer > 180) {
        this.currentLevel++;
        if (this.currentLevel >= LEVELS.length) {
          this.atTitle = true;
          this.currentLevel = 0;
        }
        this.loadLevel();
      }
      return;
    }
    if ((this.upMove === 0) && (this.downMove === 0) && (this.leftMove === 0) && (this.rightMove === 0)) {
      if (this.down) {
        STEP_SOUND.play();
        this.downMove = 8;
      } else if (this.up) {
        STEP_SOUND.play();
        this.upMove = 8;
      } else if (this.left) {
        STEP_SOUND.play();
        this.leftMove = 10;
      } else if (this.right) {
        STEP_SOUND.play();
        this.rightMove = 10;
      } else {
        this.updateSwitches();
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
        this.activate(Math.floor((this.mirrorPlayer.x+x) / 10), Math.floor((this.mirrorPlayer.y+y) / 8));
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
    if (floor === SPIKES) {
      // spikes
      this.die("you fell on spikes!");
    }
  }

  collect(obj: number): void {
    if (obj === GEM) {
      // got the gem
      WIN_SOUND.play();
      this.win = true;
      this.winTimer = 0;
      localStorage.setItem("complete." + LEVELS[this.currentLevel].file, "true");
    }
  }

  fallAt(x: number, y: number): boolean {
    const floor: number = this.level.get(FLOOR, x, y);

    return FALL_THROUGH.indexOf(floor) >= 0;
  }

  boxCanMoveTo(x: number, y: number): boolean {
    if ((x < 0) || (y < 0) || (x >= this.level.width) || (y >= this.level.height)) {
      return false;
    }
    if (this.level.get(OBJECTS, x, y) !== 0) {
      return false;
    }
    const floor: number = this.level.get(FLOOR, x, y);
    if (floor === SPIKES) {
      return false;
    } 
    if (floor === 6) {
      return false;
    } 
    if (floor === 16) {
      return false;
    } 
    if (floor === 26) {
      return false;
    } 

    return true;
  }

  blocked(x: number, y: number): boolean {
    if ((x < 0) || (y < 0) || (x >= this.level.width) || (y >= this.level.height)) {
      return true;
    }
    if (this.fallAt(x, y)) {
      return true;
    }

    const obj: number = this.level.get(OBJECTS, x, y);
    if (obj === BOX) {
      let dx: number = this.leftMove > 0 ? -1 : this.rightMove > 0 ? 1 : 0;
      let dy: number = this.upMove > 0 ? -1 : this.downMove > 0 ? 1 : 0;
      let px: number = Math.floor(this.player.x / 10);
      let py: number = Math.floor(this.player.y / 8);
      let mx: number = Math.floor(this.mirrorPlayer.x / 10);
      let my: number = Math.floor(this.mirrorPlayer.y / 8);

      if (y < 10) {
        dy = -dy;
      }
      // push it through the mirror
      if (y+dy === 10) {
        dy *= 2;

        // can't push it through on to the otherplayer
        if ((x === px) && (y+dy === py)) {
          console.log("Stopped A");
          return true;
        }
        if ((x === mx) && (y+dy === my + 1)) {
          return true;
        }
        if ((x === mx) && (y+dy === my )) {
          return true;
        }
      }

      if (this.boxCanMoveTo(x+dx, y+dy)) {
        this.level.set(OBJECTS, x, y, 0);
        this.level.set(OBJECTS, x+dx, y+dy, BOX);
        return false;
      } else {
        return true;
      }
    }

    return (obj != 0) && (COLLECT.indexOf(obj) < 0);
  }

  drawLevelSelect(): void {
    Graphics.button("Select Level", 10, GREY);

    let i: number = 0;
    for (const level of LEVELS) {
      if (this.currentLevel === i) {
        Graphics.fillRect(30, 30 + (i * 9) - 1, Graphics.width() - 60, 8, GREEN);
      }
      Graphics.center(level.name, 30 + (i * 9));
      if (localStorage.getItem("complete." + level.file)) {
        SPRITES.draw(Graphics.width() - 28, 30 + (i * 9) - 1, 13);
      }
      i++;
    }
    Graphics.button("ESC = Rage Quit", 140, GREY, 140);
  }

  mouseDown(x: number, y: number): void {
    if (y < 20) {
      x = Math.floor((x - (Graphics.width() - 48)) / 24);
      if (x === 0) {
        Settings.setSoundsOn(!Settings.isSoundOn());
        CLICK_SOUND.play();
      }
      if (x === 1) {
        Settings.setMusicOn(!Settings.isMusicOn());
        CLICK_SOUND.play();
      }
    }
  }

  drawTitle(): void {
    SPRITES.draw(Graphics.width() - 48, 2, 8);
    SPRITES.draw(Graphics.width() - 36, 2, Settings.isSoundOn() ? 19 : 18);
    SPRITES.draw(Graphics.width() - 24, 2, 9);
    SPRITES.draw(Graphics.width() - 12, 2, Settings.isMusicOn() ? 19 : 18);

    Graphics.push();
    Graphics.translate(Math.floor((Graphics.width() / 2) - 40), 10);

    TITLE.draw(-20, 0);
    Graphics.pop();
    Graphics.button("Move", 70, GREY, 70);
    Graphics.center("Arrow Keys", 82);
    Graphics.button("Switch", 90, GREY, 70);
    Graphics.center("Space", 102);

    Graphics.center("Collect The", 124);
    Graphics.center("Mirror Gems", 130);

    SPRITES.draw(30, 124, 11);
    SPRITES.draw(116, 124, 11);
    Graphics.button("press space to start", 140, GREEN, 140);
  }

  drawGame(): void {
    let frame = 0;
    if (this.moving) {
      frame = FRAMES[Math.floor(this.counter / 5) % FRAMES.length];
    }

    Graphics.push();
    Graphics.translate(Math.floor((Graphics.width() / 2) - 40), 0);
    let drawnMirrorPlayer: boolean = false;
    this.renderer.drawRows(SPRITES, 0, 0, 0, -2, 0, 1, 8, 9, (row: number, layer: number) => {
      if (!drawnMirrorPlayer && !this.dead) {
        if (layer === FLOOR) {
          if (row === Math.floor((this.mirrorPlayer.y + 4) / 8)) {
            drawnMirrorPlayer = true;

            Graphics.setAlpha(this.fadeAlpha);
            if (this.flipped) {
              Graphics.push();
              Graphics.scale(-1, 1);
              SPRITES.draw(-this.mirrorPlayer.x - 12, this.mirrorPlayer.y - 4, (this.facingDown ? 30 : 20) + frame);
              Graphics.pop();
            } else {
              SPRITES.draw(this.mirrorPlayer.x, this.mirrorPlayer.y - 4, (this.facingDown ? 30 : 20) + frame);
            }
            Graphics.setAlpha(1);
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
    this.renderer.drawRows(SPRITES, 0, 0, 0, -2, 0, 10, 8, 9, (row: number, layer: number) => {
      if (!drawnPlayer && !this.dead) {
        if (layer === FLOOR) {
          if (row === Math.floor((this.player.y + 4) / 8)) {
            drawnPlayer = true;

            Graphics.setAlpha(this.fadeAlpha);
            if (this.flipped) {
              Graphics.push();
              Graphics.scale(-1, 1);
              SPRITES.draw(-this.player.x - 12, this.player.y - 4, (this.facingDown ? 20 : 30) + frame);
              Graphics.pop();
            } else {
              SPRITES.draw(this.player.x, this.player.y - 4, (this.facingDown ? 20 : 30) + frame);
            }
            Graphics.setAlpha(1);
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
      Graphics.fillRect(0, (Graphics.height() / 2) - 14, Graphics.width(), 17, RED_SHADE);
      Graphics.button("OH NO!", (Graphics.height() / 2) - 14, "rgba(0,0,0,0)");
      Graphics.center(this.death, (Graphics.height() / 2) - 4);
    }
    if (this.win) {
      Graphics.fillRect(0, (Graphics.height() / 2) - 14, Graphics.width(), 17, GREEN_SHADE);
      Graphics.button("WELL DONE", (Graphics.height() / 2) - 14, "rgba(0,0,0,0)");
      Graphics.center("YOU GOT THE MIRROR GEM!", (Graphics.height() / 2) - 4);
    }
    if (this.levelStarting > 0) {
      Graphics.fillRect(0, (Graphics.height() / 2) - 12, Graphics.width(), 15, SHADE);
      Graphics.button(LEVELS[this.currentLevel].name === null ? "Custom Level" : LEVELS[this.currentLevel].name, (Graphics.height() / 2) - 10, "rgba(0,0,0,0)");
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
        if (this.atTitle) {
          this.drawTitle();
        } else if (this.atLevelSelect) {
          this.drawLevelSelect();
        } else {
          this.updateGame();
          this.drawGame();
        }
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