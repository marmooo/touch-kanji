cp -r graded-kanji-examples/dist/* src/data
mkdir -p docs
cp -r src/* docs
drop-inline-css -r src -o docs
deno run -A bundle.js ./src/index.js > docs/index.js
deno run -A bundle.js ./src/drill.js > docs/drill.js
minify -r docs -o .
