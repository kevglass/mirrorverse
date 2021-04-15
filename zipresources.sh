rm -f dist/game.dat
zip -r dist/game.dat data

echo Generate index.html
VALUE=`jq .version < data/version.json`
cp src/index.html dist
cp src/manifest.webmanifest dist
sed -i '' "s/%VERSION%/$VALUE/g" "dist/index.html"
sed -i '' "s/%VERSION%/$VALUE/g" "dist/bundle.js"
sed -i '' "s/%VERSION%/$VALUE/g" "dist/manifest.webmanifest"
echo $VALUE > dist/version
echo Done generation
