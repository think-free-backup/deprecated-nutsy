#!/bin/bash

if [ $# -ne 1 ];
then
    echo "You must give a domain name for your certificate"
    exit
fi

echo "Generating server key"
openssl genrsa -out server.key 4096 
echo "Generating csr.pem"
openssl req -days 3650 -new -key server.key -out csr.pem -subj "/C=ES/ST=Denial/L=Spain/O=$1/CN=$1"
echo "Generating cert.pem"
openssl x509 -req -in csr.pem -signkey server.key -out cert.pem

