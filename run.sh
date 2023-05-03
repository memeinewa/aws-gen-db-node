for f in ./output/*.*; do
    chmod 777 $f
    $f
done