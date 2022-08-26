#!/bin/bash

echo -n '{
  "language": "code_arduino",
  "groups": [
      [0, 400],
      [401, 800],
      [801, 1400],
      [1401, 12000]
  ],
  "quotes": ['

printComma=0
counter=1
for i in $(find . -name "*.ino")
do
    if [ $printComma -eq 1 ];
    then
        echo ','
    else
        echo ''
        printComma=1
    fi
    name=$(echo $i | sed -z 's/\.ino//g;s/\.\///g')
    str=$(./toLine.sh $i)
    full=${#str}
    backslash=$(echo $str | grep -o "\\\\" | wc -l)
    trueBackslash=$(echo $str | grep -o "\\\\\\\\\\\\\\\\" | wc -l)
    len=$(($full-$backslash+$trueBackslash))
    #echo $len >> stats.csv
    echo -n '{
      "text": "'${str}'",
      "source": "Arduino examples - '${name}'",
      "length": '${len}',
      "id": '${counter}'
    }'
    counter=$(($counter+1))
done

echo '
  ]
}'