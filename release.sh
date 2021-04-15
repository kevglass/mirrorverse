VALUE=`jq .version < data/version.json`
VALUE=`echo $VALUE + 1 | bc`
echo "{ \"version\" : $VALUE }" > data/version.json
echo "Building version:" $VALUE;

npm run release
cp basedist/* dist
sed -i '' "s/%CACHE_NAME%/mirroverse-v2/" "dist/sw.js"
sed -i '' "s/%PATH%//" "dist/sw.js"

#butler push dist kevglass/ups-and-downs:html
