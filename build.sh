cp -r graded-kanji-examples/dist/* src/data
mkdir -p docs
cp -r src/* docs
minify -r src -o docs

