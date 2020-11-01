dir=docs
cp -r src/* $dir
minify src/index.html > $dir/index.html
minify src/index.js > $dir/index.js
minify src/drill.js > $dir/drill.js
minify src/drill/index.html > $dir/drill/index.html

