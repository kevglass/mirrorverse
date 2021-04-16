import Graphics from "./sleek/Graphics";
import ImageResource from "./sleek/resources/ImageResource";
import Resources from "./sleek/resources/Resources";
import SoundResource from "./sleek/resources/SoundResource";
import TileSet from "./sleek/resources/TileSet";
import ZipResource from "./sleek/resources/ZipResource";

export let SPRITES: TileSet;
export let MIRROR: ImageResource;
export let TITLE: ImageResource;
export let CC_LOGO: ImageResource;

export let WIN_SOUND: SoundResource;
export let DIE_SOUND: SoundResource;
export let STEP_SOUND: SoundResource;
export let SWITCH_SOUND: SoundResource;
export let FAIL_SOUND: SoundResource;
export let SLIDE_SOUND: SoundResource;
export let CLICK_SOUND: SoundResource;
export let MUSIC: SoundResource;

Resources.onZipLoadingComplete = (zip: ZipResource) => {
  Graphics.setFonts(new TileSet(zip.getPng("img/font.png"), 6),
                    new TileSet(zip.getPng("img/font.png").toColor(0, 0, 0), 6));
                    
  SPRITES = new TileSet(zip.getPng("img/sprites.png"), 12);
  MIRROR = zip.getPng("img/mirror.png");
  TITLE = zip.getPng("img/title.png");
  CC_LOGO = zip.getPng("img/cc.png");
  MUSIC = zip.getMp3("music/music.mp3");

  WIN_SOUND = zip.getMp3("sound/win.mp3");
  DIE_SOUND = zip.getMp3("sound/die.mp3");
  STEP_SOUND = zip.getMp3("sound/step.mp3");
  SWITCH_SOUND = zip.getMp3("sound/switch.mp3");
  FAIL_SOUND = zip.getMp3("sound/fail.mp3");
  SLIDE_SOUND = zip.getMp3("sound/slide.mp3");
  CLICK_SOUND = zip.getMp3("sound/click.mp3");
};