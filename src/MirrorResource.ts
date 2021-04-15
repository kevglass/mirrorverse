import Graphics from "./sleek/Graphics";
import ImageResource from "./sleek/resources/ImageResource";
import Resources from "./sleek/resources/Resources";
import TileSet from "./sleek/resources/TileSet";
import ZipResource from "./sleek/resources/ZipResource";

export let SPRITES: TileSet;
export let MIRROR: ImageResource;
export let CC_LOGO: ImageResource;

Resources.onZipLoadingComplete = (zip: ZipResource) => {
  Graphics.setFonts(new TileSet(zip.getPng("img/font.png"), 6),
                    new TileSet(zip.getPng("img/font.png").toColor(0, 0, 0), 6));
                    
  SPRITES = new TileSet(zip.getPng("img/sprites.png"), 12);
  MIRROR = zip.getPng("img/mirror.png");
  CC_LOGO = zip.getPng("img/cc.png");
};