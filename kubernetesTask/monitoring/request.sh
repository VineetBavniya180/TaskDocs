#!/bin/bash 

req="http://172.18.0.3:31001"

list=("/", "/about", "/slow", "veryslow", "/random-delay")

while true; do
  for endpoint in "${list[@]}"; do
    echo "Requesting $req$endpoint"
    curl -s "$req$endpoint"
    echo -e "\n"
    sleep 1
  done
    sleep 5
done