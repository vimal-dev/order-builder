```ssh-keygen -t rsa -b 4096 -m PEM -f private.key```
```ssh-keygen -f private.key -e -m PKCS8 > public.key```


## With Opennssl

``openssl genrsa -out ./keys/private.pem 4096``
``openssl rsa -in ./keys/private.pem -pubout -outform PEM -out ./keys/public.pem``



## Remove Withspace to make it env friendly


cat keyfile.pem | tr -d ' \n' > clean_key.pem
