#!/bin/bash

rm stats.csv

echo -n '{
  "language": "code_systemverilog",
  "groups": [
      [0, 500],
      [501, 4000],
      [4001, 8000],
      [8001, 15000]
  ],
  "quotes": ['

printComma=0
counter=1
for i in $(find . -name "*.sv")
do
    if [ $printComma -eq 1 ];
    then
        echo ','
    else
        echo ''
        printComma=1
    fi
    _name=$(echo $i | sed -z 's/\.sv//g;s/\.\///g')
    _str=$(sed -z 's/\\/\\\\\\\\/g;s/"/\\"/g;s/\n/\\\\n/g;s/\ \ \ \ /\\\\a/g;s/\\\\n\\\\a/\\\\n\\\\t/g;s/\\\\a\\\\a/\\\\t\\\\t/g;s/\\\\t\\\\a/\\\\t\\\\t/g;s/\\\\a/\ \ \ \ /g' $i)
    _full=${#_str}
    _backslash=$(echo $_str | grep -o "\\\\" | wc -l)
    _quot=$(echo $_str | grep -o "\\\"" | wc -l)
    _trueBackslash=$(echo $_str | grep -o "\\\\\\\\\\\\\\\\" | wc -l)
    _len=$(($_full-$_backslash/2-$_quot+$_trueBackslash))
    echo $_full $_backslash $_quot $_trueBackslash $_len >> stats.csv
    echo -n '      {
      "text": "'"${_str}"'",
      "source": "'"${_name}"'",
      "length": '"${_len}"',
      "id": '"${counter}"'
    }'
    counter=$(($counter+1))
done

echo '
  ]
}'