import MirrorGame from "./MirrorGame";

try {
  const game: MirrorGame = new MirrorGame();
  game.init();
} catch (e: any) {
  console.error(e);
}