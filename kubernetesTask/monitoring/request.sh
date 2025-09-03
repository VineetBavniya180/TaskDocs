#!/bin/bash 

req="http://172.18.0.2:31001"

list=("/" "/about" "/slow" "/very-slow" "/random-delay")

while true; do
  for endpoint in "${list[@]}"; do
    echo "Requesting $req$endpoint"
    curl --head -X GET "$req$endpoint" | grep "HTTP/"
    echo -e "\n"
    sleep 1
  done
    sleep 5
done